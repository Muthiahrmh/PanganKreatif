const express = require('express');
const { getOnboarding } = require('../controllers/onboardingController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, getOnboarding);

module.exports = router;