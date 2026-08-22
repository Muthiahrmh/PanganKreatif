const express = require('express');
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  katalogKomoditas,
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

/**
 * Kenali pengguna kalau ada token, tapi jangan tolak kalau tidak ada.
 *
 * Katalog tetap bisa dilihat tanpa login, namun kalau yang meminta
 * adalah UMKM yang sudah masuk, jarak dan estimasi pengiriman bisa
 * dihitung dari kotanya.
 */
function kenaliOpsional(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    } catch {
      // Token tidak sah diabaikan saja, bukan alasan menolak
    }
  }
  next();
}

// Katalog terkelompok untuk halaman Cari Pemasok.
// Didaftarkan sebelum '/:id' supaya tidak tertangkap sebagai id.
router.get('/katalog', kenaliOpsional, katalogKomoditas);

router.get('/', kenaliOpsional, listProducts);
router.get('/:id', getProduct);
router.post('/', authenticate, authorize('supplier'), createProduct);
router.put('/:id', authenticate, authorize('supplier'), updateProduct);
router.delete('/:id', authenticate, authorize('supplier'), deleteProduct);

module.exports = router;