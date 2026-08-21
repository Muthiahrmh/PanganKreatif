const express = require('express');
const { getForecast } = require('../controllers/weatherController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/forecast', authenticate, getForecast);

module.exports = router;