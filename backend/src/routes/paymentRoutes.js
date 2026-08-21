const express = require('express');
const {
  buatPembayaran,
  terimaNotifikasi,
  periksaStatus,
  infoPembayaran,
  batalkanPembayaran,
} = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Webhook dari Midtrans — tanpa autentikasi karena dipanggil dari luar.
// Keasliannya diverifikasi lewat tanda tangan SHA-512 di controller.
router.post('/notification', terimaNotifikasi);

// Informasi pembayaran tingkat platform
router.get('/info', authenticate, infoPembayaran);

// UMKM memulai pembayaran daring untuk kontribusinya
router.post('/items/:itemId', authenticate, authorize('umkm'), buatPembayaran);

// Batalkan pembayaran yang masih menunggu, supaya bisa bayar ulang
router.delete('/:transactionId', authenticate, authorize('umkm'), batalkanPembayaran);

// Pengecekan status, dipakai selama webhook belum bisa dijangkau
router.get('/:transactionId/status', authenticate, periksaStatus);

module.exports = router;