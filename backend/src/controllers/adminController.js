const prisma = require('../utils/prisma');
const { COMMISSION_RATE, COST_PER_TRANSACTION, toNum, round2 } = require('../utils/pricing');

const monthKey = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (key) => {
    const [y, m] = key.split('-');
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${names[Number(m) - 1]} ${y}`;
};

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

module.exports = { getStats, listUsers, listAllTransactions };