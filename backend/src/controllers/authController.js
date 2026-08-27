const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const mailer = require('../utils/email');

const BERLAKU_MENIT = Number(process.env.VERIFY_TOKEN_MINUTES ?? 5);
const JEDA_KIRIM_ULANG_DETIK = Number(process.env.VERIFY_RESEND_SECONDS ?? 60);

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['umkm', 'supplier']),
  phone: z.string().optional(),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  groupName: z.string().optional(),
  city: z.string(),
  address: z.string(),
});

function buatToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const kedaluwarsa = new Date(Date.now() + BERLAKU_MENIT * 60_000);
  return { token, hash, kedaluwarsa };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function tautanVerifikasi(token) {
  const dasar = process.env.CLIENT_URL || 'http://localhost:3000';
  return `${dasar.replace(/\/$/, '')}/verifikasi?token=${token}`;
}

async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return res.status(409).json({ error: 'Email sudah terdaftar' });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const { token, hash, kedaluwarsa } = buatToken();

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      phone: data.phone,
      emailVerified: false,
      verifyTokenHash: hash,
      verifyTokenExpires: kedaluwarsa,
      verifySentAt: new Date(),
      ...(data.role === 'umkm' && {
        umkmProfile: {
          create: {
            businessName: data.businessName || data.name,
            businessType: data.businessType || 'umum',
            city: data.city,
            address: data.address,
          },
        },
      }),
      ...(data.role === 'supplier' && {
        supplierProfile: {
          create: {
            groupName: data.groupName || data.name,
            city: data.city,
            address: data.address,
          },
        },
      }),
    },
    include: { umkmProfile: true, supplierProfile: true },
  });

  let emailTerkirim = false;
  let pesanEmail = null;

  if (mailer.terkonfigurasi()) {
    try {
      await mailer.kirimVerifikasi({
        email: user.email,
        nama: user.name,
        tautan: tautanVerifikasi(token),
        berlakuMenit: BERLAKU_MENIT,
      });
      emailTerkirim = true;
    } catch (err) {
      console.error('Email verifikasi gagal dikirim:', err.message);
      pesanEmail = 'Email verifikasi gagal dikirim. Coba minta kirim ulang.';
    }
  } else {
    pesanEmail = 'Pengiriman email belum dikonfigurasi di server.';
    console.warn('SMTP belum diatur, token verifikasi:', token);
  }

  return res.status(201).json({
    perluVerifikasi: true,
    email: user.email,
    emailTerkirim,
    berlakuMenit: BERLAKU_MENIT,
    pesan:
      pesanEmail ??
      `Kami sudah mengirim tautan verifikasi. Tautan berlaku ${BERLAKU_MENIT} menit.`,
  });
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { umkmProfile: true, supplierProfile: true },
  });
  if (!user) return res.status(401).json({ error: 'Email atau password salah' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Email atau password salah' });

  if (!user.emailVerified) {
    return res.status(403).json({
      error: 'Email belum diverifikasi. Cek kotak masukmu atau minta kirim ulang.',
      perluVerifikasi: true,
      email: user.email,
    });
  }

  const token = signToken(user);
  return res.json({ token, user: sanitizeUser(user) });
}

const verifySchema = z.object({ token: z.string().min(10) });

async function verifikasiEmail(req, res) {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Token tidak valid' });

  const hash = hashToken(parsed.data.token);

  const user = await prisma.user.findFirst({
    where: { verifyTokenHash: hash },
    include: { umkmProfile: true, supplierProfile: true },
  });

  if (!user) {
    return res.status(400).json({ error: 'Tautan verifikasi tidak dikenali' });
  }

  if (user.emailVerified) {
    return res.json({ berhasil: true, sudahPernah: true, email: user.email });
  }

  if (!user.verifyTokenExpires || user.verifyTokenExpires < new Date()) {
    return res.status(400).json({
      error: 'Tautan verifikasi sudah kedaluwarsa. Minta kirim ulang.',
      kedaluwarsa: true,
      email: user.email,
    });
  }

  const diperbarui = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      verifyTokenHash: null,
      verifyTokenExpires: null,
    },
    include: { umkmProfile: true, supplierProfile: true },
  });

  const dasar = process.env.CLIENT_URL || 'http://localhost:3000';
  mailer.kirimSelamatDatang({
    email: diperbarui.email,
    nama: diperbarui.name,
    tautanMasuk: `${dasar.replace(/\/$/, '')}/login`,
  });

  return res.json({
    berhasil: true,
    sudahPernah: false,
    email: diperbarui.email,
    nama: diperbarui.name,
  });
}

const ulangSchema = z.object({ email: z.string().email() });

async function kirimUlangVerifikasi(req, res) {
  const parsed = ulangSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Email tidak valid' });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  const jawabanUmum = {
    pesan: 'Kalau email tersebut terdaftar dan belum terverifikasi, tautan baru sudah dikirim.',
  };

  if (!user || user.emailVerified) return res.json(jawabanUmum);

  if (user.verifySentAt) {
    const selisih = (Date.now() - new Date(user.verifySentAt).getTime()) / 1000;
    if (selisih < JEDA_KIRIM_ULANG_DETIK) {
      return res.status(429).json({
        error: `Tunggu ${Math.ceil(JEDA_KIRIM_ULANG_DETIK - selisih)} detik sebelum meminta lagi.`,
      });
    }
  }

  const { token, hash, kedaluwarsa } = buatToken();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verifyTokenHash: hash,
      verifyTokenExpires: kedaluwarsa,
      verifySentAt: new Date(),
    },
  });

  if (!mailer.terkonfigurasi()) {
    console.warn('SMTP belum diatur, token verifikasi:', token);
    return res.status(503).json({ error: 'Pengiriman email belum dikonfigurasi di server.' });
  }

  try {
    await mailer.kirimVerifikasi({
      email: user.email,
      nama: user.name,
      tautan: tautanVerifikasi(token),
      berlakuMenit: BERLAKU_MENIT,
    });
  } catch (err) {
    console.error('Email verifikasi gagal dikirim:', err.message);
    return res.status(502).json({ error: 'Email gagal dikirim. Coba beberapa saat lagi.' });
  }

  return res.json(jawabanUmum);
}

const lupaSchema = z.object({ email: z.string().email() });

async function lupaPassword(req, res) {
  const parsed = lupaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Email tidak valid' });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  const jawabanUmum = {
    pesan: 'Jika email terdaftar, tautan pemulihan kata sandi telah dikirim.',
  };

  if (!user) return res.json(jawabanUmum);

  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const kedaluwarsa = new Date(Date.now() + 30 * 60_000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hash,
      resetPasswordExpires: kedaluwarsa,
    },
  });

  if (!mailer.terkonfigurasi()) {
    console.warn('SMTP belum diatur, token reset password:', token);
    return res.status(503).json({ error: 'Pengiriman email belum dikonfigurasi di server.' });
  }

  try {
    const dasar = process.env.CLIENT_URL || 'http://localhost:3000';
    const tautan = `${dasar.replace(/\/$/, '')}/resetPassword?token=${token}&email=${user.email}`;

    await mailer.kirimResetPassword({
      email: user.email,
      nama: user.name,
      tautan,
      berlakuMenit: 30,
    });
  } catch (err) {
    console.error('Email reset password gagal dikirim:', err.message);
    return res.status(502).json({ error: 'Email gagal dikirim. Coba beberapa saat lagi.' });
  }

  return res.json(jawabanUmum);
}

const resetSchema = z.object({
  token: z.string().min(10),
  email: z.string().email(),
  password: z.string().min(6),
});

async function resetPassword(req, res) {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { token, email, password } = parsed.data;
  const hash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      email,
      resetPasswordToken: hash,
      resetPasswordExpires: { gte: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ error: 'Tautan tidak valid atau sudah kedaluwarsa.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  return res.json({ berhasil: true, pesan: 'Kata sandi berhasil diubah. Silakan masuk.' });
}

async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { umkmProfile: true, supplierProfile: true },
  });
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
  return res.json(sanitizeUser(user));
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function sanitizeUser(user) {
  const { passwordHash, verifyTokenHash, verifyTokenExpires, verifySentAt, resetPasswordToken, resetPasswordExpires, ...rest } = user;
  return rest;
}

module.exports = {
  register,
  login,
  me,
  verifikasiEmail,
  kirimUlangVerifikasi,
  lupaPassword,
  resetPassword,
};