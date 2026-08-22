const express = require('express');
const {
    getProfile,
    listMyProducts,
    listMyOrders,
    getStats,
    getDemandInsights,
    getPendapatan,
} = require('../controllers/supplierController');
const { listSupplierTransactions } = require('../controllers/transactionController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('supplier'));

router.get('/profile', getProfile);
router.get('/stats', getStats);
router.get('/products', listMyProducts);
router.get('/orders', listMyOrders);
router.get('/demand', getDemandInsights);
router.get('/pendapatan', getPendapatan);
router.get('/transactions', listSupplierTransactions);

module.exports = router;