const prisma = require('../utils/prisma');
const { resolveUnitPrice } = require('../utils/pricing');

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

async function getProfile(req, res) {
    const profile = await getSupplierProfile(req, res);
    if (!profile) return;

    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, email: true, phone: true, role: true },
    });

    res.json({ ...profile, user });
}

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
            const pricing = resolveUnitPrice(o.product, o.totalQuantity);
            const price = pricing.unitPrice;
            const items = o.items.map((it) => ({
                ...it,
                quantity: num(it.quantity),
                subtotal: num(it.quantity) * price,
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

async function getDemandInsights(req, res) {
    const profile = await getSupplierProfile(req, res);
    if (!profile) return;

    const days = Math.min(Number(req.query.days) || 90, 365);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const cityFilter = req.query.city ? String(req.query.city) : null;

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

module.exports = {
    getProfile,
    listMyProducts,
    listMyOrders,
    getStats,
    getDemandInsights,
};