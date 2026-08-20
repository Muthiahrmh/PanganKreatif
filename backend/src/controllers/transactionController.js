const { z } = require('zod');
const prisma = require('../utils/prisma');
const { splitPayment, resolveUnitPrice } = require('../utils/pricing');

const createTxSchema = z.object({
  amount: z.number().positive(),
  paymentProofUrl: z.string().url().optional(),
});

// UMKM buat transaksi pembayaran utk salah satu order item miliknya
async function createTransaction(req, res) {
  const parsed = createTxSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const umkmProfile = await prisma.umkmProfile.findUnique({ where: { userId: req.user.id } });
  if (!umkmProfile) return res.status(403).json({ error: 'Bukan akun UMKM' });

  const item = await prisma.procurementOrderItem.findUnique({
    where: { id: req.params.itemId },
  });
  if (!item || item.umkmId !== umkmProfile.id) {
    return res.status(403).json({ error: 'Item order tidak ditemukan / bukan milik anda' });
  }

  // Pisahkan komisi platform dari hak supplier, lalu simpan keduanya.
  const split = splitPayment(parsed.data.amount);

  const transaction = await prisma.transaction.create({
    data: {
      orderItemId: item.id,
      amount: split.amount,
      paymentProofUrl: parsed.data.paymentProofUrl,
      status: 'pending',
      platformFee: split.platformFee,
      commissionRate: split.commissionRate,
      supplierPayout: split.supplierPayout,
    },
  });

  res.status(201).json(transaction);
}

// Verifikasi pembayaran. Boleh dilakukan admin, atau supplier pemilik order.
const updateStatusSchema = z.object({
  status: z.enum(['pending', 'success', 'failed']),
});

async function updateTransactionStatus(req, res) {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const transaction = await prisma.transaction.findUnique({
    where: { id: req.params.id },
    include: {
      orderItem: {
        include: {
          order: { include: { product: true } },
        },
      },
    },
  });
  if (!transaction) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

  if (req.user.role === 'supplier') {
    const supplierProfile = await prisma.supplierProfile.findUnique({
      where: { userId: req.user.id },
    });
    const ownerId = transaction.orderItem.order.product.supplierId;
    if (!supplierProfile || ownerId !== supplierProfile.id) {
      return res.status(403).json({ error: 'Transaksi ini bukan untuk order anda' });
    }
  } else if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak untuk role ini' });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.transaction.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
    });

    await tx.procurementOrderItem.update({
      where: { id: transaction.orderItemId },
      data: { status: parsed.data.status === 'success' ? 'paid' : 'pending' },
    });

    return t;
  });

  res.json(updated);
}

async function listTransactionsByItem(req, res) {
  const transactions = await prisma.transaction.findMany({
    where: { orderItemId: req.params.itemId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(transactions);
}

// ---------- Riwayat pembayaran UMKM ----------

async function listMyTransactions(req, res) {
  const umkmProfile = await prisma.umkmProfile.findUnique({ where: { userId: req.user.id } });
  if (!umkmProfile) return res.status(403).json({ error: 'Bukan akun UMKM' });

  const transactions = await prisma.transaction.findMany({
    where: { orderItem: { umkmId: umkmProfile.id } },
    include: {
      orderItem: {
        include: {
          order: { include: { product: { include: { supplier: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(
    transactions.map((t) => {
      const order = t.orderItem.order;
      const pricing = resolveUnitPrice(order.product, order.totalQuantity);
      const qty = Number(t.orderItem.quantity);

      return {
        id: t.id,
        amount: Number(t.amount),
        platformFee: Number(t.platformFee),
        status: t.status,
        createdAt: t.createdAt,
        paymentProofUrl: t.paymentProofUrl,
        quantity: qty,
        itemStatus: t.orderItem.status,
        orderStatus: order.status,
        // Berapa yang dihemat berkat pembelian kolektif
        unitPrice: pricing.unitPrice,
        normalPrice: pricing.normalPrice,
        isBulkActive: pricing.isBulkActive,
        saving: pricing.isBulkActive ? pricing.savingPerUnit * qty : 0,
        product: {
          name: order.product.name,
          unit: order.product.unit,
          category: order.product.category,
        },
        supplier: {
          groupName: order.product.supplier.groupName,
          city: order.product.supplier.city,
        },
      };
    })
  );
}

// ---------- Pembayaran masuk ke supplier ----------

async function listSupplierTransactions(req, res) {
  const supplierProfile = await prisma.supplierProfile.findUnique({
    where: { userId: req.user.id },
  });
  if (!supplierProfile) return res.status(403).json({ error: 'Bukan akun supplier' });

  const transactions = await prisma.transaction.findMany({
    where: { orderItem: { order: { product: { supplierId: supplierProfile.id } } } },
    include: {
      orderItem: {
        include: {
          umkm: true,
          order: { include: { product: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(
    transactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      platformFee: Number(t.platformFee),
      supplierPayout: Number(t.supplierPayout),
      status: t.status,
      createdAt: t.createdAt,
      paymentProofUrl: t.paymentProofUrl,
      quantity: Number(t.orderItem.quantity),
      umkm: {
        businessName: t.orderItem.umkm.businessName,
        city: t.orderItem.umkm.city,
      },
      product: {
        name: t.orderItem.order.product.name,
        unit: t.orderItem.order.product.unit,
      },
    }))
  );
}

module.exports = {
  createTransaction,
  updateTransactionStatus,
  listTransactionsByItem,
  listMyTransactions,
  listSupplierTransactions,
};