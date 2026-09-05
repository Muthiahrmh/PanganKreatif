const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const mailer = require('../utils/email');
const { geocodeAlamat } = require('../utils/geocoding');

const BERLAKU_MENIT = Number(process.env.VERIFY_TOKEN_MINUTES ?? 5);
const JEDA_KIRIM_ULANG_DETIK = Number(process.env.VERIFY_RESEND_SECONDS ?? 60);
const OTP_MENIT = Number(process.env.OTP_MINUTES ?? 5);
const OTP_MAKS_PERCOBAAN = 5;
const DEVICE_TRUST_HARI = Number(process.env.DEVICE_TRUST_DAYS ?? 30);

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

/** Kode OTP 6 digit — dipakai sebagai lapis kedua autentikasi login */
function buatOtp() {
  const kode = String(crypto.randomInt(100000, 1000000));
  const hash = hashToken(kode);
  const kedaluwarsa = new Date(Date.now() + OTP_MENIT * 60_000);
  return { kode, hash, kedaluwarsa };
}

function tautanVerifikasi(token) {
  const dasar = process.env.CLIENT_URL || 'http://localhost:3000';
  return `${dasar.replace(/\/$/, '')}/verifikasi?token=${token}`;
}

/** Token "ingat perangkat ini" — diterbitkan setelah OTP login lolos,
 *  supaya login berikutnya dari perangkat yang sama tidak perlu OTP lagi. */
function buatDeviceToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = hashToken(token);
  const kedaluwarsa = new Date(Date.now() + DEVICE_TRUST_HARI * 24 * 60 * 60_000);
  return { token, hash, kedaluwarsa };
}

/** Cek apakah deviceToken dari klien cocok dengan perangkat tepercaya
 *  milik user ini dan belum kedaluwarsa. Kalau ya, OTP boleh dilewati. */
async function cariPerangkatTepercaya(userId, deviceToken) {
  if (!deviceToken) return null;
  const hash = hashToken(deviceToken);
  const perangkat = await prisma.trustedDevice.findUnique({ where: { tokenHash: hash } });
  if (!perangkat || perangkat.userId !== userId) return null;

  if (perangkat.expiresAt < new Date()) {
    await prisma.trustedDevice.delete({ where: { id: perangkat.id } }).catch(() => {});
    return null;
  }

  await prisma.trustedDevice.update({
    where: { id: perangkat.id },
    data: { lastUsedAt: new Date() },
  });
  return perangkat;
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

  // Geocoding alamat, best-effort — kalau gagal/tidak dikenali, profil
  // tetap dibuat tanpa koordinat presisi. jarak/pengiriman otomatis
  // jatuh kembali ke perkiraan titik-pusat-kota (lihat utils/jarak.js).
  const lokasi = await geocodeAlamat({ alamat: data.address, kota: data.city });

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
            latitude: lokasi?.lat ?? null,
            longitude: lokasi?.lon ?? null,
          },
        },
      }),
      ...(data.role === 'supplier' && {
        supplierProfile: {
          create: {
            groupName: data.groupName || data.name,
            city: data.city,
            address: data.address,
            latitude: lokasi?.lat ?? null,
            longitude: lokasi?.lon ?? null,
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
  // Diisi otomatis oleh klien kalau perangkat ini pernah lolos OTP
  // sebelumnya. Opsional — kalau kosong atau tidak cocok, alur OTP
  // normal tetap berjalan.
  deviceToken: z.string().optional(),
});

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password, deviceToken } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { umkmProfile: true, supplierProfile: true },
  });
  if (!user) return res.status(401).json({ error: 'Email atau password salah' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Email atau password salah' });

  // Admin hanya satu akun tetap milik pengelola platform, bukan akun yang
  // didaftarkan sendiri lewat halaman register. Karena itu dua langkah email
  // — gerbang emailVerified dan kode OTP — dilewati: cukup email + password.
  if (user.role === 'admin') {
    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  }

  if (!user.emailVerified) {
    return res.status(403).json({
      error: 'Email belum diverifikasi. Cek kotak masukmu atau minta kirim ulang.',
      perluVerifikasi: true,
      email: user.email,
    });
  }

  // Perangkat ini sudah pernah lolos OTP dan belum kedaluwarsa —
  // lewati lapis kedua, langsung terbitkan token seperti admin.
  const perangkat = await cariPerangkatTepercaya(user.id, deviceToken);
  if (perangkat) {
    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  }

  // Lapis kedua: kode OTP dikirim ke email, token JWT baru diterbitkan
  // setelah kode itu diverifikasi lewat /login/verify-otp
  const { kode, hash, kedaluwarsa } = buatOtp();

  await prisma.user.update({
    where: { id: user.id },
    data: { otpHash: hash, otpExpires: kedaluwarsa, otpSentAt: new Date(), otpAttempts: 0 },
  });

  if (mailer.terkonfigurasi()) {
    try {
      await mailer.kirimOtp({
        email: user.email,
        nama: user.name,
        kode,
        berlakuMenit: OTP_MENIT,
      });
    } catch (err) {
      console.error('Email OTP gagal dikirim:', err.message);
    }
  } else {
    console.warn('SMTP belum diatur, kode OTP login untuk', user.email, ':', kode);
  }

  return res.json({
    perluOtp: true,
    email: user.email,
    berlakuMenit: OTP_MENIT,
  });
}

const otpSchema = z.object({
  email: z.string().email(),
  kode: z.string().length(6),
  // Dicentang user di form OTP. Default true kalau tidak dikirim
  // (mis. klien lama), supaya perilaku sebelumnya tidak berubah.
  ingatPerangkat: z.boolean().optional(),
});

async function verifikasiOtpLogin(req, res) {
  const parsed = otpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Kode tidak valid' });

  const { email, kode, ingatPerangkat } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { umkmProfile: true, supplierProfile: true },
  });

  if (!user || !user.otpHash) {
    return res.status(400).json({
      error: 'Tidak ada permintaan login yang menunggu. Silakan masuk ulang.',
    });
  }

  if (!user.otpExpires || user.otpExpires < new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { otpHash: null, otpExpires: null, otpAttempts: 0 },
    });
    return res.status(400).json({
      error: 'Kode sudah kedaluwarsa. Silakan masuk ulang.',
      kedaluwarsa: true,
    });
  }

  if (user.otpAttempts >= OTP_MAKS_PERCOBAAN) {
    await prisma.user.update({
      where: { id: user.id },
      data: { otpHash: null, otpExpires: null, otpAttempts: 0 },
    });
    return res.status(429).json({
      error: 'Terlalu banyak percobaan salah. Silakan masuk ulang untuk kode baru.',
      kedaluwarsa: true,
    });
  }

  const hash = hashToken(kode);
  // Perbandingan waktu tetap, supaya tidak bocor lewat selisih waktu
  const a = Buffer.from(hash);
  const b = Buffer.from(user.otpHash);
  const cocok = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!cocok) {
    await prisma.user.update({
      where: { id: user.id },
      data: { otpAttempts: { increment: 1 } },
    });
    const sisa = OTP_MAKS_PERCOBAAN - (user.otpAttempts + 1);
    return res.status(400).json({
      error: sisa > 0 ? `Kode salah. Sisa ${sisa} percobaan.` : 'Kode salah.',
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { otpHash: null, otpExpires: null, otpAttempts: 0 },
  });

  // OTP baru saja lolos di perangkat ini. Kalau user centang "ingat
  // perangkat ini" (default kalau tidak dikirim), terbitkan token
  // supaya login berikutnya dari perangkat yang sama tidak perlu OTP
  // lagi selama DEVICE_TRUST_HARI hari ke depan. Kalau di-uncheck,
  // tidak ada perangkat tepercaya yang dibuat — OTP tetap wajib lagi
  // di login berikutnya, sama seperti sebelum fitur ini ada.
  let deviceToken;
  if (ingatPerangkat ?? true) {
    const dibuat = buatDeviceToken();
    deviceToken = dibuat.token;
    await prisma.trustedDevice.create({
      data: {
        userId: user.id,
        tokenHash: dibuat.hash,
        expiresAt: dibuat.kedaluwarsa,
        userAgent: req.headers['user-agent'] || null,
      },
    });
  }

  const token = signToken(user);
  return res.json({ token, user: sanitizeUser(user), ...(deviceToken && { deviceToken }) });
}

async function kirimUlangOtpLogin(req, res) {
  const parsed = ulangSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Email tidak valid' });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Jawaban dibuat sama supaya halaman ini tidak bisa dipakai menebak
  // email mana yang sedang punya sesi login menunggu OTP
  const jawabanUmum = { pesan: 'Kalau ada permintaan login yang menunggu, kode baru sudah dikirim.' };

  if (!user || !user.otpHash) return res.json(jawabanUmum);

  if (user.otpSentAt) {
    const selisih = (Date.now() - new Date(user.otpSentAt).getTime()) / 1000;
    if (selisih < JEDA_KIRIM_ULANG_DETIK) {
      return res.status(429).json({
        error: `Tunggu ${Math.ceil(JEDA_KIRIM_ULANG_DETIK - selisih)} detik sebelum meminta lagi.`,
      });
    }
  }

  const { kode, hash, kedaluwarsa } = buatOtp();

  await prisma.user.update({
    where: { id: user.id },
    data: { otpHash: hash, otpExpires: kedaluwarsa, otpSentAt: new Date(), otpAttempts: 0 },
  });

  if (mailer.terkonfigurasi()) {
    try {
      await mailer.kirimOtp({ email: user.email, nama: user.name, kode, berlakuMenit: OTP_MENIT });
    } catch (err) {
      console.error('Email OTP gagal dikirim:', err.message);
      return res.status(502).json({ error: 'Email gagal dikirim. Coba beberapa saat lagi.' });
    }
  } else {
    console.warn('SMTP belum diatur, kode OTP login untuk', user.email, ':', kode);
  }

  return res.json(jawabanUmum);
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

  // Password baru diganti — cabut semua perangkat tepercaya lama supaya
  // wajib OTP lagi di login berikutnya, dari perangkat mana pun.
  await prisma.trustedDevice.deleteMany({ where: { userId: user.id } });

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
  const {
    passwordHash,
    verifyTokenHash,
    verifyTokenExpires,
    verifySentAt,
    resetPasswordToken,
    resetPasswordExpires,
    otpHash,
    otpExpires,
    otpSentAt,
    otpAttempts,
    ...rest
  } = user;
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
  verifikasiOtpLogin,
  kirimUlangOtpLogin,
};