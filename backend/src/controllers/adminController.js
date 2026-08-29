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
    const now = new Date();
    const awalRentang = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Penjumlahan dikerjakan basis data, bukan ditarik ke memori.
    // Dengan ribuan transaksi, memuat semuanya lalu menjumlah di sini
    // memakan waktu dan memori tanpa perlu.
    const [
        umkmCount,
        supplierCount,
        productCount,
        orderTotal,
        orderOpen,
        orderDelivered,
        volumeAgg,
        suksesAgg,
        tertundaAgg,
    ] = await Promise.all([
        prisma.umkmProfile.count(),
        prisma.supplierProfile.count(),
        prisma.product.count(),
        prisma.procurementOrder.count(),
        prisma.procurementOrder.count({ where: { status: 'open' } }),
        prisma.procurementOrder.count({ where: { status: 'delivered' } }),
        prisma.procurementOrder.aggregate({ _sum: { totalQuantity: true } }),
        prisma.transaction.aggregate({
            where: { status: 'success' },
            _sum: { amount: true, platformFee: true, distributionMargin: true },
            _count: { _all: true },
        }),
        prisma.transaction.aggregate({
            where: { status: 'pending' },
            _sum: { amount: true },
            _count: { _all: true },
        }),
    ]);

    const gmv = round2(toNum(suksesAgg._sum.amount));
    const komisi = round2(toNum(suksesAgg._sum.platformFee));
    const margin = round2(toNum(suksesAgg._sum.distributionMargin));
    const revenue = round2(komisi + margin);
    const successCount = suksesAgg._count._all;
    const cogs = round2(successCount * COST_PER_TRANSACTION);

    // Tren enam bulan: hanya kolom angka, tanpa relasi
    const transaksiRentang = await prisma.transaction.findMany({
        where: { status: 'success', createdAt: { gte: awalRentang } },
        select: { createdAt: true, amount: true, platformFee: true, distributionMargin: true },
    });

    const series = new Map();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const k = monthKey(d);
        series.set(k, { key: k, label: monthLabel(k), gmv: 0, revenue: 0, count: 0 });
    }

    for (const t of transaksiRentang) {
        const row = series.get(monthKey(t.createdAt));
        if (!row) continue;
        row.gmv = round2(row.gmv + toNum(t.amount));
        row.revenue = round2(row.revenue + toNum(t.platformFee) + toNum(t.distributionMargin));
        row.count += 1;
    }

    // Komoditas teratas lewat kueri agregat langsung, karena Prisma
    // belum bisa mengelompokkan berdasarkan kolom di tabel relasi
    const topCommodities = await prisma.$queryRaw`
    select p.name,
           p.unit,
           sum(i.quantity)::float as quantity,
           sum(t.amount)::float   as value
    from transactions t
    join procurement_order_items i on i.id = t.order_item_id
    join procurement_orders o      on o.id = i.order_id
    join products p                on p.id = o.product_id
    where t.status = 'success'
    group by p.name, p.unit
    order by value desc
    limit 5
  `;

    const recent = await prisma.transaction.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
            orderItem: {
                include: {
                    umkm: { select: { businessName: true } },
                    order: {
                        select: {
                            product: {
                                select: { name: true, supplier: { select: { groupName: true } } },
                            },
                        },
                    },
                },
            },
        },
    });

    res.json({
        commissionRate: COMMISSION_RATE,
        users: { umkm: umkmCount, supplier: supplierCount, total: umkmCount + supplierCount },
        catalog: { products: productCount },
        orders: {
            total: orderTotal,
            open: orderOpen,
            delivered: orderDelivered,
            totalVolume: round2(toNum(volumeAgg._sum.totalQuantity)),
        },
        finance: {
            gmv,
            revenue,
            komisi,
            margin,
            cogs,
            grossProfit: round2(revenue - cogs),
            successCount,
            pendingCount: tertundaAgg._count._all,
            pendingValue: round2(toNum(tertundaAgg._sum.amount)),
        },
        series: [...series.values()],
        topCommodities: topCommodities.map((c) => ({
            name: c.name,
            unit: c.unit,
            quantity: round2(c.quantity),
            value: round2(c.value),
        })),
        recentTransactions: recent.map((t) => ({
            id: t.id,
            amount: toNum(t.amount),
            platformFee: toNum(t.platformFee),
            distributionMargin: toNum(t.distributionMargin),
            status: t.status,
            createdAt: t.createdAt,
            umkm: t.orderItem.umkm.businessName,
            supplier: t.orderItem.order.product.supplier.groupName,
            product: t.orderItem.order.product.name,
        })),
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
            distributionMargin: toNum(t.distributionMargin),
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
            distributionMargin: true,
            supplierPayout: true,
            createdAt: true,
            payoutAt: true,
            payoutProofUrl: true,
            payoutProofPath: true,
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
                                            ewalletNumber: true,
                                            ewalletHolder: true,
                                            ewalletProviders: true,
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
            dompetDigital: sup.ewalletNumber && sup.ewalletProviders?.length > 0
                ? {
                    nomor: sup.ewalletNumber,
                    atasNama: sup.ewalletHolder,
                    providers: sup.ewalletProviders,
                }
                : null,
            jumlahTransaksi: 0,
            totalNilai: 0,
            totalKomisi: 0,
            totalMargin: 0,
            totalDiteruskan: 0,
            transaksiTerakhir: null,
            buktiTransaksiId: null,
            catatan: null,
        };

        entri.jumlahTransaksi += 1;
        entri.totalNilai = round2(entri.totalNilai + toNum(t.amount));
        entri.totalKomisi = round2(entri.totalKomisi + toNum(t.platformFee));
        entri.totalMargin = round2(entri.totalMargin + toNum(t.distributionMargin));
        entri.totalDiteruskan = round2(entri.totalDiteruskan + toNum(t.supplierPayout));

        const waktu = status === 'paid' ? t.payoutAt : t.createdAt;
        if (!entri.transaksiTerakhir || (waktu && waktu > entri.transaksiTerakhir)) {
            entri.transaksiTerakhir = waktu;
            if (status === 'paid') {
                // Kirim id transaksinya saja; tautan bukti diminta terpisah
                // lewat endpoint yang memeriksa hak akses
                entri.buktiTransaksiId =
                    t.payoutProofUrl || t.payoutProofPath ? t.id : null;
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
            totalMargin: round2(daftar.reduce((s, d) => s + d.totalMargin, 0)),
            totalDiteruskan: round2(daftar.reduce((s, d) => s + d.totalDiteruskan, 0)),
            tanpaRekening: daftar.filter((d) => !d.rekening && !d.dompetDigital).length,
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
    let buktiPath;
    try {
        const hasil = await storage.uploadBuktiPayout(
            req.params.supplierId,
            req.file.buffer,
            req.file.mimetype
        );
        buktiUrl = hasil.url;
        buktiPath = hasil.path;
    } catch (err) {
        return res.status(502).json({ error: err.message });
    }

    await prisma.transaction.updateMany({
        where: { id: { in: sasaran.map((t) => t.id) } },
        data: {
            payoutStatus: 'paid',
            payoutAt: new Date(),
            payoutProofUrl: buktiUrl,
            payoutProofPath: buktiPath,
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