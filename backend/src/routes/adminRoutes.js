const express = require('express');
const multer = require('multer');
const {
    getStats,
    listUsers,
    listAllTransactions,
    getPayouts,
    tandaiPayout,
} = require('../controllers/adminController');
const { daftarDitahan, lepasPaksa } = require('../controllers/fulfillmentController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 3 * 1024 * 1024 },
});

router.use(authenticate, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', listUsers);
router.get('/transactions', listAllTransactions);

// Penerusan dana ke pemasok
router.get('/payouts', getPayouts);
router.post('/payouts/:supplierId', upload.single('bukti'), tandaiPayout);

// Dana yang masih ditahan karena barangnya belum dikonfirmasi UMKM,
// beserta jalan keluar untuk kasus sengketa.
router.get('/escrow', daftarDitahan);
router.post('/escrow/:itemId/lepas', lepasPaksa);

module.exports = router;