const prisma = require('../utils/prisma');
const { COMMISSION_RATE, COST_PER_TRANSACTION, toNum, round2 } = require('../utils/pricing');
const storage = require('../utils/supabaseStorage');

const monthKey = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (key) => {
    const [y, m] = key.split('-');
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${names[Number(m) - 1]} ${y}`;
};

/**
 * GET /api/admin/stats
 * Ringkasan bisnis platform: berapa transaksi yang lewat sistem,
 * berapa nilainya, dan berapa yang jadi pendapatan PanganKreatif.
 */
async function getStats(req, res) {
    const [umkmCount, supplierCount, productCount, orders, transactions] = await Promise.all([
        prisma.umkmProfile.count(),
        prisma.supplierProfile.count(),
        prisma.product.count(),
        prisma.procurementOrder.findMany({
            include: { product: true, items: true },
        }),
        prisma.transaction.findMany({
            include: {
                orderItem: {
                    include: {
                        umkm: true,
                        order: { include: { product: { include: { supplier: true } } } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
    ]);

    const success = transactions.filter((t) => t.status === 'success');
    const pending = transactions.filter((t) => t.status === 'pending');

    // GMV = total nilai barang yang mengalir lewat platform
    const gmv = round2(success.reduce((s, t) => s + toNum(t.amount), 0));
    // Pendapatan platform = akumulasi komisi
    const revenue = round2(success.reduce((s, t) => s + toNum(t.platformFee), 0));
    // HPP menurut Bab V proposal: biaya komputasi & verifikasi per transaksi
    const cogs = round2(success.length * COST_PER_TRANSACTION);

    // Tren 6 bulan terakhir
    const series = new Map();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        series.set(monthKey(d), { key: monthKey(d), label: monthLabel(monthKey(d)), gmv: 0, revenue: 0, count: 0 });
    }
    for (const t of success) {
        const k = monthKey(t.createdAt);
        const row = series.get(k);
        if (row) {
            row.gmv = round2(row.gmv + toNum(t.amount));
            row.revenue = round2(row.revenue + toNum(t.platformFee));
            row.count += 1;
        }
    }

    // Komoditas paling banyak ditransaksikan
    const byCommodity = new Map();
    for (const t of success) {
        const p = t.orderItem.order.product;
        const entry = byCommodity.get(p.name) || { name: p.name, unit: p.unit, quantity: 0, value: 0 };
        entry.quantity += toNum(t.orderItem.quantity);
        entry.value = round2(entry.value + toNum(t.amount));
        byCommodity.set(p.name, entry);
    }
    const topCommodities = [...byCommodity.values()]
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const recentTransactions = transactions.slice(0, 8).map((t) => ({
        id: t.id,
        amount: toNum(t.amount),
        platformFee: toNum(t.platformFee),
        status: t.status,
        createdAt: t.createdAt,
        umkm: t.orderItem.umkm.businessName,
        supplier: t.orderItem.order.product.supplier.groupName,
        product: t.orderItem.order.product.name,
    }));

    res.json({
        commissionRate: COMMISSION_RATE,
        users: { umkm: umkmCount, supplier: supplierCount, total: umkmCount + supplierCount },
        catalog: { products: productCount },
        orders: {
            total: orders.length,
            open: orders.filter((o) => o.status === 'open').length,
            delivered: orders.filter((o) => o.status === 'delivered').length,
            totalVolume: round2(orders.reduce((s, o) => s + toNum(o.totalQuantity), 0)),
        },
        finance: {
            gmv,
            revenue,
            cogs,
            grossProfit: round2(revenue - cogs),
            successCount: success.length,
            pendingCount: pending.length,
            pendingValue: round2(pending.reduce((s, t) => s + toNum(t.amount), 0)),
        },
        series: [...series.values()],
        topCommodities,
        recentTransactions,
    });
}

/**
 * GET /api/admin/users
 * Daftar mitra terdaftar, buat halaman kelola pengguna.
 */
async function listUsers(req, res) {
    const users = await prisma.user.findMany({
        where: { role: { in: ['umkm', 'supplier'] } },
        include: { umkmProfile: true, supplierProfile: true },
        orderBy: { createdAt: 'desc' },
    });

    res.json(
        users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            createdAt: u.createdAt,
            businessName: u.umkmProfile?.businessName ?? u.supplierProfile?.groupName ?? null,
            city: u.umkmProfile?.city ?? u.supplierProfile?.city ?? null,
            businessType: u.umkmProfile?.businessType ?? null,
        }))
    );
}

/**
 * GET /api/admin/transactions
 * Semua transaksi di platform beserta komisinya.
 */
async function listAllTransactions(req, res) {
    const { status } = req.query;

    const transactions = await prisma.transaction.findMany({
        where: { ...(status && { status: String(status) }) },
        include: {
            orderItem: {
                include: {
                    umkm: true,
                    order: { include: { product: { include: { supplier: true } } } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.json(
        transactions.map((t) => ({
            id: t.id,
            amount: toNum(t.amount),
            platformFee: toNum(t.platformFee),
            supplierPayout: toNum(t.supplierPayout),
            commissionRate: toNum(t.commissionRate),
            status: t.status,
            createdAt: t.createdAt,
            quantity: toNum(t.orderItem.quantity),
            umkm: {
                businessName: t.orderItem.umkm.businessName,
                city: t.orderItem.umkm.city,
            },
            supplier: {
                groupName: t.orderItem.order.product.supplier.groupName,
                city: t.orderItem.order.product.supplier.city,
            },
            product: {
                name: t.orderItem.order.product.name,
                unit: t.orderItem.order.product.unit,
            },
        }))
    );
}


/**
 * GET /api/admin/payouts
 *
 * Rekap kewajiban platform kepada pemasok.
 *
 * Uang dari UMKM masuk lebih dulu ke rekening platform. Komisi
 * tinggal di platform, sisanya (supplierPayout) menjadi utang yang
 * harus diteruskan. Halaman ini yang mencatat mana yang sudah dan
 * belum diteruskan.
 */
async function getPayouts(req, res) {
    const status = req.query.status === 'paid' ? 'paid' : 'pending';

    // Hanya ambil kolom yang perlu — jumlah transaksi bisa ribuan
    const transaksi = await prisma.transaction.findMany({
        where: { status: 'success', payoutStatus: status },
        select: {
            id: true,
            amount: true,
            platformFee: true,
            supplierPayout: true,
            createdAt: true,
            payoutAt: true,
            payoutProofUrl: true,
            payoutNote: true,
            orderItem: {
                select: {
                    quantity: true,
                    order: {
                        select: {
                            product: {
                                select: {
                                    name: true,
                                    unit: true,
                                    supplier: {
                                        select: {
                                            id: true,
                                            groupName: true,
                                            city: true,
                                            bankName: true,
                                            bankAccountNumber: true,
                                            bankAccountHolder: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const perPemasok = new Map();

    for (const t of transaksi) {
        const sup = t.orderItem?.order?.product?.supplier;
        if (!sup) continue;

        const entri = perPemasok.get(sup.id) || {
            supplierId: sup.id,
            groupName: sup.groupName,
            city: sup.city,
            rekening: sup.bankName
                ? {
                    bank: sup.bankName,
                    nomor: sup.bankAccountNumber,
                    atasNama: sup.bankAccountHolder,
                }
                : null,
            jumlahTransaksi: 0,
            totalNilai: 0,
            totalKomisi: 0,
            totalDiteruskan: 0,
            transaksiTerakhir: null,
            buktiUrl: null,
            catatan: null,
        };

        entri.jumlahTransaksi += 1;
        entri.totalNilai = round2(entri.totalNilai + toNum(t.amount));
        entri.totalKomisi = round2(entri.totalKomisi + toNum(t.platformFee));
        entri.totalDiteruskan = round2(entri.totalDiteruskan + toNum(t.supplierPayout));

        const waktu = status === 'paid' ? t.payoutAt : t.createdAt;
        if (!entri.transaksiTerakhir || (waktu && waktu > entri.transaksiTerakhir)) {
            entri.transaksiTerakhir = waktu;
            if (status === 'paid') {
                entri.buktiUrl = t.payoutProofUrl;
                entri.catatan = t.payoutNote;
            }
        }

        perPemasok.set(sup.id, entri);
    }

    const daftar = [...perPemasok.values()].sort((a, b) => b.totalDiteruskan - a.totalDiteruskan);

    res.json({
        status,
        ringkasan: {
            jumlahPemasok: daftar.length,
            jumlahTransaksi: transaksi.length,
            totalNilai: round2(daftar.reduce((s, d) => s + d.totalNilai, 0)),
            totalKomisi: round2(daftar.reduce((s, d) => s + d.totalKomisi, 0)),
            totalDiteruskan: round2(daftar.reduce((s, d) => s + d.totalDiteruskan, 0)),
            tanpaRekening: daftar.filter((d) => !d.rekening).length,
        },
        pemasok: daftar,
    });
}

/**
 * POST /api/admin/payouts/:supplierId
 * Tandai seluruh dana tertunda milik satu pemasok sudah diteruskan.
 */
async function tandaiPayout(req, res) {
    const catatan = typeof req.body?.catatan === 'string' ? req.body.catatan.slice(0, 300) : null;

    // Bukti transfer wajib — pemasok berhak melihat buktinya
    if (!req.file) {
        return res.status(400).json({ error: 'Bukti transfer wajib diunggah' });
    }

    const izin = ['image/jpeg', 'image/png', 'image/webp'];
    if (!izin.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Bukti harus berupa gambar JPG, PNG, atau WEBP' });
    }
    if (req.file.size > 3 * 1024 * 1024) {
        return res.status(400).json({ error: 'Ukuran bukti maksimal 3 MB' });
    }
    if (!storage.isConfigured()) {
        return res.status(503).json({ error: 'Penyimpanan bukti belum dikonfigurasi di server' });
    }

    const sasaran = await prisma.transaction.findMany({
        where: {
            status: 'success',
            payoutStatus: 'pending',
            orderItem: { order: { product: { supplierId: req.params.supplierId } } },
        },
        select: { id: true, supplierPayout: true },
    });

    if (sasaran.length === 0) {
        return res.status(400).json({ error: 'Tidak ada dana tertunda untuk pemasok ini' });
    }

    const total = round2(sasaran.reduce((s, t) => s + toNum(t.supplierPayout), 0));

    let buktiUrl;
    try {
        const hasil = await storage.uploadBuktiPayout(
            req.params.supplierId,
            req.file.buffer,
            req.file.mimetype
        );
        buktiUrl = hasil.url;
    } catch (err) {
        return res.status(502).json({ error: err.message });
    }

    await prisma.transaction.updateMany({
        where: { id: { in: sasaran.map((t) => t.id) } },
        data: {
            payoutStatus: 'paid',
            payoutAt: new Date(),
            payoutProofUrl: buktiUrl,
            ...(catatan ? { payoutNote: catatan } : {}),
        },
    });

    res.json({
        diteruskan: sasaran.length,
        total,
        buktiUrl,
    });
}

module.exports = { getStats, listUsers, listAllTransactions, getPayouts, tandaiPayout };