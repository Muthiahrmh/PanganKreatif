const express = require('express');
const {
  listSalesRecords,
  createSalesRecord,
  bulkCreateSalesRecords,
} = require('../controllers/salesController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('umkm'));
router.get('/', listSalesRecords);
router.post('/', createSalesRecord);
router.post('/bulk', bulkCreateSalesRecords);

module.exports = router;
