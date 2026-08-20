const { z } = require('zod');
const prisma = require('../utils/prisma');

async function listProducts(req, res) {
  const { category, city } = req.query;
  const products = await prisma.product.findMany({
    where: {
      ...(category && { category: String(category) }),
      ...(city && { supplier: { city: String(city) } }),
    },
    include: { supplier: true },
    orderBy: { name: 'asc' },
  });
  res.json(products);
}

async function getProduct(req, res) {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { supplier: true },
  });
  if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });
  res.json(product);
}

// Angka opsional: string kosong dari form dianggap "tidak diisi"
const optionalPositive = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
  z.number().positive().optional()
);

const productSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  // Harga grosir aktif otomatis kalau total pesanan kolektif >= bulkMinQty
  bulkPrice: optionalPositive,
  bulkMinQty: optionalPositive,
});

function validateBulk(data) {
  const { bulkPrice, bulkMinQty, price } = data;
  const punyaSalahSatu = bulkPrice != null || bulkMinQty != null;
  if (!punyaSalahSatu) return null;
  if (bulkPrice == null || bulkMinQty == null) {
    return 'Harga grosir dan minimal kuantitas harus diisi keduanya';
  }
  if (price != null && bulkPrice >= price) {
    return 'Harga grosir harus lebih murah dari harga normal';
  }
  return null;
}

async function createProduct(req, res) {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const bulkError = validateBulk(parsed.data);
  if (bulkError) return res.status(400).json({ error: bulkError });

  const supplierProfile = await prisma.supplierProfile.findUnique({
    where: { userId: req.user.id },
  });
  if (!supplierProfile) return res.status(403).json({ error: 'Bukan akun supplier' });

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      bulkPrice: parsed.data.bulkPrice ?? null,
      bulkMinQty: parsed.data.bulkMinQty == null ? null : Math.trunc(parsed.data.bulkMinQty),
      supplierId: supplierProfile.id,
    },
  });
  res.status(201).json(product);
}

async function updateProduct(req, res) {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const supplierProfile = await prisma.supplierProfile.findUnique({
    where: { userId: req.user.id },
  });
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });
  if (!supplierProfile || product.supplierId !== supplierProfile.id) {
    return res.status(403).json({ error: 'Bukan pemilik produk ini' });
  }

  const bulkError = validateBulk({
    ...parsed.data,
    price: parsed.data.price ?? Number(product.price),
  });
  if (bulkError) return res.status(400).json({ error: bulkError });

  const data = { ...parsed.data };
  if ('bulkPrice' in parsed.data) data.bulkPrice = parsed.data.bulkPrice ?? null;
  if ('bulkMinQty' in parsed.data) {
    data.bulkMinQty =
      parsed.data.bulkMinQty == null ? null : Math.trunc(parsed.data.bulkMinQty);
  }

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data,
  });
  res.json(updated);
}

async function deleteProduct(req, res) {
  const supplierProfile = await prisma.supplierProfile.findUnique({
    where: { userId: req.user.id },
  });
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });
  if (!supplierProfile || product.supplierId !== supplierProfile.id) {
    return res.status(403).json({ error: 'Bukan pemilik produk ini' });
  }
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };