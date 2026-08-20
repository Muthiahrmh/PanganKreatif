const express = require('express');
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
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/orders', listOrders);
router.get('/orders/:id', getOrder);
router.post('/orders', authenticate, authorize('supplier'), createOrder);
router.patch('/orders/:id/close', authenticate, authorize('supplier'), closeOrder);
router.patch('/orders/:id/deliver', authenticate, authorize('supplier'), markDelivered);
router.post('/orders/:id/join', authenticate, authorize('umkm'), joinOrder);

router.get('/items/mine', authenticate, authorize('umkm'), listMyItems);

router.get('/transactions/mine', authenticate, authorize('umkm'), listMyTransactions);

router.post(
  '/items/:itemId/transactions',
  authenticate,
  authorize('umkm'),
  createTransaction
);
router.get(
  '/items/:itemId/transactions',
  authenticate,
  listTransactionsByItem
);
router.patch(
  '/transactions/:id/status',
  authenticate,
  authorize('admin', 'supplier'),
  updateTransactionStatus
);

module.exports = router;