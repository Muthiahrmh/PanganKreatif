const { z } = require('zod');
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const storage = require('../utils/supabaseStorage');

function sanitizeUser(user) {
    const { passwordHash, ...rest } = user;
    return rest;
}

const withProfiles = { umkmProfile: true, supplierProfile: true };

async function getProfile(req, res) {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: withProfiles,
    });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(sanitizeUser(user));
}

const updateSchema = z.object({
    name: z.string().min(2, 'Nama minimal 2 karakter').optional(),
    phone: z.string().optional().nullable(),
    // UMKM
    businessName: z.string().min(1).optional(),
    businessType: z.string().min(1).optional(),
    // Supplier
    groupName: z.string().min(1).optional(),
    // Keduanya
    city: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
});

async function updateProfile(req, res) {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const d = parsed.data;

    const userData = {};
    if (d.name !== undefined) userData.name = d.name;
    if (d.phone !== undefined) userData.phone = d.phone || null;

    // Bangun data profil sesuai role. Kolom yang tidak dikirim tidak disentuh.
    const profileData = {};
    if (d.city !== undefined) profileData.city = d.city;
    if (d.address !== undefined) profileData.address = d.address;

    if (req.user.role === 'umkm') {
        if (d.businessName !== undefined) profileData.businessName = d.businessName;
        if (d.businessType !== undefined) profileData.businessType = d.businessType;

        if (Object.keys(profileData).length > 0) {
            userData.umkmProfile = { update: profileData };
        }
    } else if (req.user.role === 'supplier') {
        if (d.groupName !== undefined) profileData.groupName = d.groupName;

        if (Object.keys(profileData).length > 0) {
            userData.supplierProfile = { update: profileData };
        }
    }

    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: userData,
        include: withProfiles,
    });

    res.json(sanitizeUser(user));
}

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
    newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
});

async function changePassword(req, res) {
    const parsed = passwordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Password saat ini salah' });

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash },
    });

    res.json({ message: 'Password berhasil diubah' });
}

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

async function uploadAvatar(req, res) {
    if (!storage.isConfigured()) {
        return res.status(503).json({
            error: 'Penyimpanan foto belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env',
        });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'Tidak ada file yang dikirim' });
    }
    if (!ALLOWED.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Format harus JPG, PNG, atau WEBP' });
    }
    if (req.file.size > MAX_SIZE) {
        return res.status(400).json({ error: 'Ukuran foto maksimal 2 MB' });
    }

    const current = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { avatarPath: true },
    });

    const { url, path } = await storage.uploadAvatar(
        req.user.id,
        req.file.buffer,
        req.file.mimetype
    );

    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { avatarUrl: url, avatarPath: path },
        include: withProfiles,
    });

    // Bersihkan file lama supaya tidak menumpuk di storage
    if (current?.avatarPath) await storage.removeAvatar(current.avatarPath);

    res.json(sanitizeUser(user));
}

async function deleteAvatar(req, res) {
    const current = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { avatarPath: true },
    });

    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { avatarUrl: null, avatarPath: null },
        include: withProfiles,
    });

    if (current?.avatarPath) await storage.removeAvatar(current.avatarPath);

    res.json(sanitizeUser(user));
}

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAvatar,
};  