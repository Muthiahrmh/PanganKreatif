const express = require('express');
const { getStats, listUsers, listAllTransactions } = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', listUsers);
router.get('/transactions', listAllTransactions);

module.exports = router;