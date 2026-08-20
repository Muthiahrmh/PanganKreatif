const express = require('express');
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', authenticate, authorize('supplier'), createProduct);
router.put('/:id', authenticate, authorize('supplier'), updateProduct);
router.delete('/:id', authenticate, authorize('supplier'), deleteProduct);

module.exports = router;
