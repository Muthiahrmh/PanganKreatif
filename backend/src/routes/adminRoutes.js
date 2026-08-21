const express = require('express');
const multer = require('multer');
const {
    getStats,
    listUsers,
    listAllTransactions,
    getPayouts,
    tandaiPayout,
} = require('../controllers/adminController');
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

module.exports = router;