const express = require('express');
const multer = require('multer');
const {
    register,
    login,
    me,
    verifikasiEmail,
    kirimUlangVerifikasi,
    lupaPassword,
    resetPassword,
    verifikasiOtpLogin,
    kirimUlangOtpLogin,
} = require('../controllers/authController');
const {
    getProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAvatar,
} = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// File ditampung di memori dulu, lalu diteruskan ke Supabase Storage.
// Tidak pernah ditulis ke disk server supaya aman saat deploy.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
});

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);

// Lapis kedua login (OTP email) — terbuka, dipanggil sebelum token JWT ada
router.post('/login/verify-otp', verifikasiOtpLogin);
router.post('/login/otp/resend', kirimUlangOtpLogin);

// Verifikasi email — terbuka, karena dipanggil sebelum bisa masuk
router.post('/verify', verifikasiEmail);
router.post('/verify/resend', kirimUlangVerifikasi);

// Lupa & Reset Password Mandiri (Terbuka untuk umum tanpa auth)
router.post('/lupaPassword', lupaPassword);
router.post('/resetPassword', resetPassword);

// Profil
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);
router.patch('/password', authenticate, changePassword);

// Foto profil
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', authenticate, deleteAvatar);

module.exports = router;