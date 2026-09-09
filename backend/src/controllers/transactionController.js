const { z } = require('zod');
const prisma = require('../utils/prisma');
const { splitPayment, resolveUnitPrice } = require('../utils/pricing');
const storage = require('../utils/supabaseStorage');
const { LABEL_FULFILLMENT, sisaJamKonfirmasi } = require('../utils/escrow');

const { daftarKanalManual } = require('./paymentController');

const createTxSchema = z.object({
  // Kode kanal dari daftar yang disediakan platform: bank, gopay, dana, dst
  kanal: z.string().max(30).default('bank'),
  catatan: z.string().max(300).optional(),
});

/**
 * Pembayaran manual oleh UMKM: transfer bank atau tunai.
 * Nilainya dihitung ulang di server dari kuantitas dikali harga
 * yang berlaku — angka dari browser tidak dipercaya.
 * Bukti transfer diunggah sebagai berkas, bukan sekadar diketik.
 */
async function createTransaction(req, res) {
  const parsed = createTxSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const umkmProfile = await prisma.umkmProfile.findUnique({ where: { userId: req.user.id } });
  if (!umkmProfile) return res.status(403).json({ error: 'Bukan akun UMKM' });

  const item = await prisma.procurementOrderItem.findUnique({
    where: { id: req.params.itemId },
    include: { order: { include: { product: true } } },
  });
  if (!item || item.umkmId !== umkmProfile.id) {
    return res.status(403).json({ error: 'Item order tidak ditemukan / bukan milik anda' });
  }
  if (item.status === 'paid') {
    return res.status(400).json({ error: 'Pesanan ini sudah lunas' });
  }

  const { kanal: kodeKanal, catatan } = parsed.data;

  // Kanal harus salah satu yang memang disediakan platform
  const kanal = daftarKanalManual().find((k) => k.kode === kodeKanal);
  if (!kanal) {
    return res.status(400).json({ error: 'Cara pembayaran tidak dikenali' });
  }

  const metode = kanal.jenis === 'cash' ? 'cash' : 'transfer';

  // Selain tunai, bukti transfer wajib
  if (metode === 'transfer' && !req.file) {
    return res.status(400).json({ error: 'Bukti transfer wajib diunggah' });
  }

  let buktiUrl = null;
  let buktiPath = null;
  if (req.file) {
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

    try {
      const hasil = await storage.uploadBuktiBayar(item.id, req.file.buffer, req.file.mimetype);
      buktiUrl = hasil.url;
      buktiPath = hasil.path;
    } catch (err) {
      return res.status(502).json({ error: err.message });
    }
  }

  const harga = resolveUnitPrice(item.order.product, item.order.totalQuantity);
  const nilai = Math.round(Number(item.quantity) * harga.unitPrice);
  const split = splitPayment(nilai);

  const transaction = await prisma.transaction.create({
    data: {
      orderItemId: item.id,
      amount: split.amount,
      paymentProofUrl: buktiUrl,
      paymentProofPath: buktiPath,
      status: 'pending',
      paymentMethod: metode,
      paymentChannel: kanal.nama,
      payoutNote: catatan || null,
      platformFee: split.platformFee,
      commissionRate: split.commissionRate,
      distributionMargin: split.distributionMargin,
      marginRate: split.marginRate,
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
        // Serah terima barang, supaya riwayat pembayaran juga menunjukkan
        // sudah sampai di mana pesanannya — bukan cuma sudah dibayar.
        fulfillmentStatus: t.orderItem.fulfillmentStatus,
        statusBarang: LABEL_FULFILLMENT[t.orderItem.fulfillmentStatus],
        shippedAt: t.orderItem.shippedAt,
        receivedAt: t.orderItem.receivedAt,
        autoConfirmAt: t.orderItem.autoConfirmAt,
        sisaJamKonfirmasi: sisaJamKonfirmasi(t.orderItem.autoConfirmAt),
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
      distributionMargin: Number(t.distributionMargin),
      supplierPayout: Number(t.supplierPayout),
      status: t.status,
      createdAt: t.createdAt,
      adaBuktiBayar: Boolean(t.paymentProofUrl || t.paymentProofPath),
      quantity: Number(t.orderItem.quantity),
      metode: t.paymentMethod,
      channel: t.paymentChannel,
      payoutStatus: t.payoutStatus,
      payoutAt: t.payoutAt,
      adaBuktiPayout: Boolean(t.payoutProofUrl || t.payoutProofPath),
      payoutNote: t.payoutNote,
      // Kenapa dananya belum cair. Pemasok berhak melihat alasannya
      // sendiri, bukan cuma melihat angka yang tak kunjung berpindah.
      escrowDilepas: Boolean(t.escrowReleasedAt),
      escrowReleasedAt: t.escrowReleasedAt,
      escrowReleaseReason: t.escrowReleaseReason,
      fulfillmentStatus: t.orderItem.fulfillmentStatus,
      statusBarang: LABEL_FULFILLMENT[t.orderItem.fulfillmentStatus],
      shippedAt: t.orderItem.shippedAt,
      receivedAt: t.orderItem.receivedAt,
      sisaJamKonfirmasi: sisaJamKonfirmasi(t.orderItem.autoConfirmAt),
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