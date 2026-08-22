const express = require('express');
const { tautanBukti } = require('../controllers/fileController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Hak akses diperiksa di dalam controller, karena bergantung
// pada peran dan keterlibatan pengguna pada transaksinya
router.get('/transaksi/:id/:jenis', authenticate, tautanBukti);

module.exports = router;