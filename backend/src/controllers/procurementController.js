const { z } = require('zod');
const prisma = require('../utils/prisma');
const { resolveUnitPrice } = require('../utils/pricing');

const createOrderSchema = z.object({
  productId: z.string().uuid(),
  deadline: z.string(), // ISO date
});

async function createOrder(req, res) {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const supplierProfile = await prisma.supplierProfile.findUnique({
    where: { userId: req.user.id },
  });
  if (!supplierProfile) return res.status(403).json({ error: 'Bukan akun supplier' });

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product || product.supplierId !== supplierProfile.id) {
    return res.status(403).json({ error: 'Produk tidak ditemukan / bukan milik anda' });
  }

  const order = await prisma.procurementOrder.create({
    data: {
      productId: parsed.data.productId,
      deadline: new Date(parsed.data.deadline),
      status: 'open',
      totalQuantity: 0,
    },
  });
  res.status(201).json(order);
}

async function listOrders(req, res) {
  const { status, productId } = req.query;
  const orders = await prisma.procurementOrder.findMany({
    where: {
      ...(status && { status: String(status) }),
      ...(productId && { productId: String(productId) }),
    },
    include: {
      product: { include: { supplier: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Tambahan info harga grosir. Field lama sengaja tidak diubah
  // supaya tampilan yang sudah ada tetap jalan.
  res.json(
    orders.map((o) => ({
      ...o,
      pricing: resolveUnitPrice(o.product, o.totalQuantity),
      participantCount: o.items.length,
    }))
  );
}

async function getOrder(req, res) {
  const order = await prisma.procurementOrder.findUnique({
    where: { id: req.params.id },
    include: {
      product: { include: { supplier: true } },
      items: { include: { umkm: true, transactions: true } },
    },
  });
  if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });
  res.json({
    ...order,
    pricing: resolveUnitPrice(order.product, order.totalQuantity),
    participantCount: order.items.length,
  });
}

// Supplier/admin nutup order manual (misal sebelum deadline karena kuota tercapai)
async function closeOrder(req, res) {
  const order = await requireOwnedOrder(req, res);
  if (!order) return;
  const updated = await prisma.procurementOrder.update({
    where: { id: order.id },
    data: { status: 'closed' },
  });
  res.json(updated);
}

async function markDelivered(req, res) {
  const order = await requireOwnedOrder(req, res);
  if (!order) return;
  const updated = await prisma.procurementOrder.update({
    where: { id: order.id },
    data: { status: 'delivered' },
  });
  res.json(updated);
}

async function requireOwnedOrder(req, res) {
  const supplierProfile = await prisma.supplierProfile.findUnique({
    where: { userId: req.user.id },
  });
  const order = await prisma.procurementOrder.findUnique({
    where: { id: req.params.id },
    include: { product: true },
  });
  if (!order) {
    res.status(404).json({ error: 'Order tidak ditemukan' });
    return null;
  }
  if (!supplierProfile || order.product.supplierId !== supplierProfile.id) {
    res.status(403).json({ error: 'Bukan pemilik order ini' });
    return null;
  }
  return order;
}

// ---------- Procurement Order Items (kontribusi UMKM ke order) ----------

const joinSchema = z.object({
  quantity: z.number().positive(),
});

// UMKM ikut gabung ke order kolektif yang lagi 'open'
async function joinOrder(req, res) {
  const parsed = joinSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const umkmProfile = await prisma.umkmProfile.findUnique({ where: { userId: req.user.id } });
  if (!umkmProfile) return res.status(403).json({ error: 'Bukan akun UMKM' });

  const order = await prisma.procurementOrder.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });
  if (order.status !== 'open') {
    return res.status(400).json({ error: 'Order sudah tidak menerima kontribusi baru' });
  }

  const existingItem = await prisma.procurementOrderItem.findFirst({
    where: { orderId: order.id, umkmId: umkmProfile.id },
  });
  if (existingItem) {
    return res.status(409).json({ error: 'Anda sudah bergabung di order ini' });
  }

  const [item] = await prisma.$transaction([
    prisma.procurementOrderItem.create({
      data: {
        orderId: order.id,
        umkmId: umkmProfile.id,
        quantity: parsed.data.quantity,
        status: 'pending',
      },
    }),
    prisma.procurementOrder.update({
      where: { id: order.id },
      data: { totalQuantity: { increment: parsed.data.quantity } },
    }),
  ]);

  res.status(201).json(item);
}

async function listMyItems(req, res) {
  const umkmProfile = await prisma.umkmProfile.findUnique({ where: { userId: req.user.id } });
  if (!umkmProfile) return res.status(403).json({ error: 'Bukan akun UMKM' });

  const items = await prisma.procurementOrderItem.findMany({
  where: { umkmId: umkmProfile.id },
  include: {
    order: {
      include: {
        product: {
          include: {
            supplier: true,
          },
        },
      },
    },
    transactions: true,
  },
  });

  res.json(
    items.map((it) => {
      const pricing = resolveUnitPrice(it.order.product, it.order.totalQuantity);
      const sup = it.order.product.supplier;

      return {
        ...it,
        pricing,
        subtotal: Number(it.quantity) * pricing.unitPrice,
        // Rekening tujuan, supaya UMKM tahu ke mana harus transfer
        rekening: sup?.bankName
          ? {
              bank: sup.bankName,
              nomor: sup.bankAccountNumber,
              atasNama: sup.bankAccountHolder,
            }
          : null,
      };
    })
  );
}

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  closeOrder,
  markDelivered,
  joinOrder,
  listMyItems,
};