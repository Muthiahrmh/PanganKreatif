const express = require('express');
const multer = require('multer');
const { register, login, me } = require('../controllers/authController');
const {
    getProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAvatar,
} = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
});

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);

router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);
router.patch('/password', authenticate, changePassword);

router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', authenticate, deleteAvatar);

module.exports = router;