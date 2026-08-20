const express = require('express');
const { generateForecast, listForecasts } = require('../controllers/forecastController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('umkm'));
router.post('/generate', generateForecast);
router.get('/', listForecasts);

module.exports = router;
