const express = require('express');
const {
    generateForecast,
    listForecasts,
    getRekomendasi,
} = require('../controllers/forecastController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('umkm'));

router.post('/generate', generateForecast);
router.get('/rekomendasi', getRekomendasi);
router.get('/', listForecasts);

module.exports = router;