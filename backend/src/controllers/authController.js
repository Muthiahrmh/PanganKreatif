const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../utils/prisma');

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['umkm', 'supplier']), // admin dibuat manual, bukan via register publik
  phone: z.string().optional(),
  // profile fields
  businessName: z.string().optional(), // umkm
  businessType: z.string().optional(), // umkm
  groupName: z.string().optional(), // supplier
  city: z.string(),
  address: z.string(),
});

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

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      phone: data.phone,
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

  const token = signToken(user);
  return res.status(201).json({ token, user: sanitizeUser(user) });
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

  const token = signToken(user);
  return res.json({ token, user: sanitizeUser(user) });
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
  const { passwordHash, ...rest } = user;
  return rest;
}

module.exports = { register, login, me };
