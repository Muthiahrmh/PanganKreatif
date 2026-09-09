const prisma = require('../utils/prisma');
const { resolveUnitPrice } = require('../utils/pricing');
const { sisaJamKonfirmasi, LABEL_FULFILLMENT } = require('../utils/escrow');

// ---------- helper ----------

// Ambil profil supplier milik user yang sedang login.
// Balikin null + kirim 403 kalau user belum punya SupplierProfile.
async function getSupplierProfile(req, res) {
    const profile = await prisma.supplierProfile.findUnique({
        where: { userId: req.user.id },
    });
    if (!profile) {
        res.status(403).json({ error: 'Akun ini belum punya profil supplier' });
        return null;
    }
    return profile;
}

const num = (v) => (v == null ? 0 : Number(v));

// ---------- GET /api/supplier/profile ----------

async function getProfile(req, res) {
    const profile = await getSupplierProfile(req, res);
    if (!profile) return;

    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, email: true, phone: true, role: true },
    });

    res.json({ ...profile, user });
}

// ---------- GET /api/supplier/products ----------

async function listMyProducts(req, res) {
    const profile = await getSupplierProfile(req, res);
    if (!profile) return;

    const products = await prisma.product.findMany({
        where: { supplierId: profile.id },
        orderBy: { name: 'asc' },
        include: {
            _count: { select: { procurementOrders: true } },
        },
    });

    res.json(
        products.map((p) => ({
            ...p,
            price: num(p.price),
            bulkPrice: p.bulkPrice == null ? null : num(p.bulkPrice),
            bulkMinQty: p.bulkMinQty,
            hasBulk: p.bulkPrice != null && p.bulkMinQty != null,
            orderCount: p._count.procurementOrders,
            _count: undefined,
        }))
    );
}

// ---------- GET /api/supplier/orders ----------
// Query: ?status=open|closed|delivered

async function listMyOrders(req, res) {
    const profile = await getSupplierProfile(req, res);
    if (!profile) return;

    const { status } = req.query;

    const orders = await prisma.procurementOrder.findMany({
        where: {
            product: { supplierId: profile.id },
            ...(status && { status: String(status) }),
        },
        include: {
            product: true,
            items: {
                include: {
                    umkm: { select: { id: true, businessName: true, businessType: true, city: true } },
                    transactions: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.json(
        orders.map((o) => {
            // Harga yang benar-benar berlaku: grosir kalau kuota tercapai
            const pricing = resolveUnitPrice(o.product, o.totalQuantity);
            const price = pricing.unitPrice;
            const items = o.items.map((it) => ({
                ...it,
                quantity: num(it.quantity),
                subtotal: num(it.quantity) * price,
                // Serah terima barang: dipakai tombol "Tandai Dikirim" dan
                // keterangan kenapa dana belum cair.
                statusBarang: LABEL_FULFILLMENT[it.fulfillmentStatus],
                sisaJamKonfirmasi: sisaJamKonfirmasi(it.autoConfirmAt),
                transactions: it.transactions.map((t) => ({ ...t, amount: num(t.amount) })),
            }));

            return {
                ...o,
                totalQuantity: num(o.totalQuantity),
                product: {
                    ...o.product,
                    price,
                    normalPrice: pricing.normalPrice,
                    bulkPrice: pricing.bulkPrice,
                    bulkMinQty: pricing.bulkMinQty,
                },
                pricing,
                items,
                participantCount: items.length,
                estimatedValue: num(o.totalQuantity) * price,
                isExpired: new Date(o.deadline) < new Date() && o.status === 'open',
            };
        })
    );
}

// ---------- GET /api/supplier/stats ----------

async function getStats(req, res) {
    const profile = await getSupplierProfile(req, res);
    if (!profile) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [products, orders] = await Promise.all([
        prisma.product.findMany({
            where: { supplierId: profile.id },
            select: { id: true, name: true, unit: true, stock: true, price: true },
        }),
        prisma.procurementOrder.findMany({
            where: { product: { supplierId: profile.id } },
            include: {
                product: { select: { price: true } },
                items: { select: { umkmId: true, quantity: true } },
            },
        }),
    ]);

    const openOrders = orders.filter((o) => o.status === 'open');
    const deliveredOrders = orders.filter((o) => o.status === 'delivered');

    const umkmIds = new Set();
    orders.forEach((o) => o.items.forEach((it) => umkmIds.add(it.umkmId)));

    const volumeThisMonth = deliveredOrders
        .filter((o) => new Date(o.createdAt) >= startOfMonth)
        .reduce((sum, o) => sum + num(o.totalQuantity), 0);

    const revenueThisMonth = deliveredOrders
        .filter((o) => new Date(o.createdAt) >= startOfMonth)
        .reduce((sum, o) => sum + num(o.totalQuantity) * num(o.product.price), 0);

    // Order yang deadline-nya lewat tapi statusnya masih open -> butuh tindakan
    const needsAction = openOrders.filter((o) => new Date(o.deadline) < now).length;

    const lowStock = products
        .filter((p) => p.stock <= 10)
        .map((p) => ({ id: p.id, name: p.name, stock: p.stock, unit: p.unit }));

    res.json({
        totalProducts: products.length,
        openOrders: openOrders.length,
        deliveredOrders: deliveredOrders.length,
        umkmReached: umkmIds.size,
        volumeThisMonth,
        revenueThisMonth,
        needsAction,
        lowStock,
    });
}

// ---------- GET /api/supplier/demand ----------
// Market Demand Analytics sederhana: komoditas apa yang paling banyak
// diminta UMKM di seluruh platform, biar supplier tahu mau pasok apa.
// Query: ?days=90&city=Lhokseumawe

async function getDemandInsights(req, res) {
    const profile = await getSupplierProfile(req, res);
    if (!profile) return;

    const days = Math.min(Number(req.query.days) || 90, 365);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const cityFilter = req.query.city ? String(req.query.city) : null;

    // 1. Permintaan dari order kolektif (semua supplier, bukan cuma milik sendiri)
    const items = await prisma.procurementOrderItem.findMany({
        where: {
            order: { createdAt: { gte: since } },
            ...(cityFilter && { umkm: { city: cityFilter } }),
        },
        include: {
            order: { include: { product: { select: { name: true, category: true, unit: true, supplierId: true } } } },
            umkm: { select: { id: true, city: true } },
        },
    });

    const byCommodity = new Map();
    for (const it of items) {
        const p = it.order.product;
        const key = `${p.name}|${p.unit}`;
        const entry = byCommodity.get(key) || {
            name: p.name,
            category: p.category,
            unit: p.unit,
            totalQuantity: 0,
            requestCount: 0,
            umkmIds: new Set(),
            suppliedByMe: false,
        };
        entry.totalQuantity += num(it.quantity);
        entry.requestCount += 1;
        entry.umkmIds.add(it.umkm.id);
        if (p.supplierId === profile.id) entry.suppliedByMe = true;
        byCommodity.set(key, entry);
    }

    const topCommodities = [...byCommodity.values()]
        .map(({ umkmIds, ...rest }) => ({ ...rest, umkmCount: umkmIds.size }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 10);

    // 2. Bahan baku yang paling laku dipakai UMKM (dari catatan penjualan mereka)
    const sales = await prisma.salesRecord.findMany({
        where: {
            date: { gte: since },
            ...(cityFilter && { umkm: { city: cityFilter } }),
        },
        select: { productName: true, quantity: true, umkmId: true },
    });

    const bySales = new Map();
    for (const s of sales) {
        const entry = bySales.get(s.productName) || {
            name: s.productName,
            totalQuantity: 0,
            umkmIds: new Set(),
        };
        entry.totalQuantity += num(s.quantity);
        entry.umkmIds.add(s.umkmId);
        bySales.set(s.productName, entry);
    }

    const topSelling = [...bySales.values()]
        .map(({ umkmIds, ...rest }) => ({ ...rest, umkmCount: umkmIds.size }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 10);

    // 3. Peluang: banyak diminta tapi belum dipasok supplier ini
    const opportunities = topCommodities.filter((c) => !c.suppliedByMe).slice(0, 5);

    res.json({
        periodDays: days,
        city: cityFilter,
        topCommodities,
        topSelling,
        opportunities,
    });
}

const namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

async function getPendapatan(req, res) {
    const profile = await getSupplierProfile(req, res);
    if (!profile) return;

    const now = new Date();
    const mode = ['bulanan', 'tahun', 'tahunan'].includes(req.query.rentang)
        ? req.query.rentang
        : 'bulanan';

    const kondisiPemasok = {
        status: 'success',
        orderItem: { order: { product: { supplierId: profile.id } } },
    };
    const semuaWaktu = await prisma.transaction.findMany({
        where: kondisiPemasok,
        select: { createdAt: true },
    });

    const tahunTersedia = [
        ...new Set(semuaWaktu.map((t) => new Date(t.createdAt).getFullYear())),
    ].sort((a, b) => b - a);

    const tahunDipilih = Number(req.query.tahun) || tahunTersedia[0] || now.getFullYear();

    let mulai;
    let sampai = null;

    if (mode === 'tahun') {
        mulai = new Date(tahunDipilih - 1, 0, 1);
        sampai = new Date(tahunDipilih + 1, 0, 1);
    } else if (mode === 'tahunan') {
        mulai = new Date(now.getFullYear() - 4, 0, 1);
    } else {
        mulai = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    }

    const transaksi = await prisma.transaction.findMany({
        where: {
            ...kondisiPemasok,
            createdAt: { gte: mulai, ...(sampai ? { lt: sampai } : {}) },
        },
        select: {
            createdAt: true,
            amount: true,
            supplierPayout: true,
            platformFee: true,
            distributionMargin: true,
            payoutStatus: true,
            orderItem: { select: { quantity: true } },
        },
    });

    const kosong = (kunci, label) => ({
        kunci,
        label,
        pendapatan: 0,
        nilaiTransaksi: 0,
        potongan: 0,
        volume: 0,
        transaksi: 0,
    });

    const kerangka = new Map();

    if (mode === 'tahunan') {
        for (let i = 4; i >= 0; i--) {
            const t = now.getFullYear() - i;
            kerangka.set(String(t), kosong(String(t), String(t)));
        }
    } else if (mode === 'tahun') {
        for (let m = 0; m < 12; m++) {
            const kunci = `${tahunDipilih}-${String(m + 1).padStart(2, '0')}`;
            kerangka.set(kunci, kosong(kunci, namaBulan[m]));
        }
    } else {
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const kunci = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            kerangka.set(
                kunci,
                kosong(kunci, `${namaBulan[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`)
            );
        }
    }

    let belumDiteruskan = 0;
    let totalTahunSebelum = 0;

    for (const t of transaksi) {
        const d = new Date(t.createdAt);
        const bersih = num(t.supplierPayout);

        if (mode === 'tahun' && d.getFullYear() === tahunDipilih - 1) {
            totalTahunSebelum += bersih;
            continue;
        }

        const kunci =
            mode === 'tahunan'
                ? String(d.getFullYear())
                : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        const baris = kerangka.get(kunci);
        if (!baris) continue;

        baris.pendapatan += bersih;
        baris.nilaiTransaksi += num(t.amount);
        baris.potongan += num(t.platformFee) + num(t.distributionMargin);
        baris.volume += num(t.orderItem?.quantity);
        baris.transaksi += 1;

        if (t.payoutStatus !== 'paid') belumDiteruskan += bersih;
    }

    const bulat = (n) => Math.round(n * 100) / 100;
    const seri = [...kerangka.values()].map((b) => ({
        ...b,
        pendapatan: bulat(b.pendapatan),
        nilaiTransaksi: bulat(b.nilaiTransaksi),
        potongan: bulat(b.potongan),
        volume: bulat(b.volume),
    }));

    const total = seri.reduce((s, b) => s + b.pendapatan, 0);
    const totalPotongan = seri.reduce((s, b) => s + b.potongan, 0);

    let pembanding = null;

    if (mode === 'tahun') {
        const selisih = totalTahunSebelum > 0
            ? Math.round(((total - totalTahunSebelum) / totalTahunSebelum) * 100)
            : null;

        pembanding = {
            jenis: 'tahun',
            label: `dibanding ${tahunDipilih - 1}`,
            nilaiPembanding: bulat(totalTahunSebelum),
            persen: selisih,
        };
    } else {
        const terakhir = seri[seri.length - 1]?.pendapatan ?? 0;
        const sebelumnya = seri[seri.length - 2]?.pendapatan ?? 0;

        pembanding = {
            jenis: mode === 'tahunan' ? 'tahun' : 'bulan',
            label: mode === 'tahunan' ? 'dibanding tahun lalu' : 'dibanding bulan lalu',
            nilaiPembanding: bulat(sebelumnya),
            persen:
                sebelumnya > 0 ? Math.round(((terakhir - sebelumnya) / sebelumnya) * 100) : null,
        };
    }

    res.json({
        rentang: mode,
        tahunDipilih: mode === 'tahun' ? tahunDipilih : null,
        tahunTersedia,
        seri,
        ringkasan: {
            total: bulat(total),
            totalPotongan: bulat(totalPotongan),
            rataRata: bulat(total / (seri.length || 1)),
            periodeTerakhir: bulat(
                mode === 'tahun' ? total : seri[seri.length - 1]?.pendapatan ?? 0
            ),
            pembanding,
            belumDiteruskan: bulat(belumDiteruskan),
            jumlahTransaksi: seri.reduce((s, b) => s + b.transaksi, 0),
        },
    });
}

module.exports = {
    getProfile,
    getPendapatan,
    listMyProducts,
    listMyOrders,
    getStats,
    getDemandInsights,
};