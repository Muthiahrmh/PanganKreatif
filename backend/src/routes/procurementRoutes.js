const express = require('express');
const multer = require('multer');
const {
  createOrder,
  listOrders,
  getOrder,
  closeOrder,
  markDelivered,
  joinOrder,
  listMyItems,
} = require('../controllers/procurementController');
const {
  createTransaction,
  updateTransactionStatus,
  listTransactionsByItem,
  listMyTransactions,
} = require('../controllers/transactionController');
const {
  tandaiDikirim,
  konfirmasiDiterima,
  ajukanKomplain,
} = require('../controllers/fulfillmentController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Bukti transfer ditampung di memori lalu diteruskan ke Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
});

// Orders
router.get('/orders', listOrders);
router.get('/orders/:id', getOrder);
router.post('/orders', authenticate, authorize('supplier'), createOrder);
router.patch('/orders/:id/close', authenticate, authorize('supplier'), closeOrder);
router.patch('/orders/:id/deliver', authenticate, authorize('supplier'), markDelivered);
router.post('/orders/:id/join', authenticate, authorize('umkm'), joinOrder);

// Items (kontribusi UMKM)
router.get('/items/mine', authenticate, authorize('umkm'), listMyItems);

// Serah terima barang — penentu boleh tidaknya dana diteruskan ke pemasok.
// Pemasok yang menyatakan barang berangkat, UMKM yang menyatakan sampai.
router.post('/items/:itemId/kirim', authenticate, authorize('supplier'), tandaiDikirim);
router.post('/items/:itemId/terima', authenticate, authorize('umkm'), konfirmasiDiterima);
router.post('/items/:itemId/komplain', authenticate, authorize('umkm'), ajukanKomplain);

// Transactions
// PENTING: /transactions/mine harus di atas rute lain yang pakai :id
router.get('/transactions/mine', authenticate, authorize('umkm'), listMyTransactions);

router.post(
  '/items/:itemId/transactions',
  authenticate,
  authorize('umkm'),
  upload.single('bukti'),
  createTransaction
);
router.get(
  '/items/:itemId/transactions',
  authenticate,
  listTransactionsByItem
);
// Supplier boleh verifikasi pembayaran ordernya sendiri; cek kepemilikan di controller
router.patch(
  '/transactions/:id/status',
  authenticate,
  authorize('admin', 'supplier'),
  updateTransactionStatus
);

module.exports = router;