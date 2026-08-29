const { z } = require('zod');
const prisma = require('../utils/prisma');
const { hitungPengiriman } = require('../utils/jarak');

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

  // Kalau yang meminta adalah UMKM, sertakan jarak dan estimasi
  // pengiriman dari kotanya ke kota tiap pemasok
  let lokasiPembeli = null;
  if (req.user?.role === 'umkm') {
    const profil = await prisma.umkmProfile.findUnique({
      where: { userId: req.user.id },
      select: { city: true, latitude: true, longitude: true },
    });
    if (profil) {
      lokasiPembeli = { kota: profil.city, lat: profil.latitude, lon: profil.longitude };
    }
  }

  res.json(
    products.map((p) => ({
      ...p,
      pengiriman: lokasiPembeli
        ? hitungPengiriman(lokasiPembeli, {
            kota: p.supplier?.city,
            lat: p.supplier?.latitude,
            lon: p.supplier?.longitude,
          })
        : null,
    }))
  );
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

/**
 * GET /api/products/katalog
 *
 * Katalog yang sudah dikelompokkan per komoditas beserta
 * perbandingan antarpemasok.
 *
 * Pengelompokan dikerjakan di server supaya browser tidak perlu
 * menerima ratusan produk lalu menyusunnya sendiri. Yang dikirim
 * hanya kolom yang benar-benar ditampilkan.
 */
async function katalogKomoditas(req, res) {
  const { q, category, city } = req.query;

  const products = await prisma.product.findMany({
    where: {
      ...(category && category !== 'all' && { category: String(category) }),
      ...(city && city !== 'all' && { supplier: { city: String(city) } }),
      ...(q && {
        OR: [
          { name: { contains: String(q), mode: 'insensitive' } },
          { supplier: { groupName: { contains: String(q), mode: 'insensitive' } } },
        ],
      }),
    },
    select: {
      id: true,
      name: true,
      category: true,
      unit: true,
      price: true,
      stock: true,
      bulkPrice: true,
      bulkMinQty: true,
      supplier: { select: { id: true, groupName: true, city: true, latitude: true, longitude: true } },
    },
    orderBy: { name: 'asc' },
  });

  // Produk yang sedang punya pesanan kolektif terbuka
  const terbuka = await prisma.procurementOrder.findMany({
    where: { status: 'open' },
    select: { productId: true },
  });
  const adaOrder = new Set(terbuka.map((o) => o.productId));

  let kotaPembeli = null;
  let lokasiPembeli = null;
  if (req.user?.role === 'umkm') {
    const profil = await prisma.umkmProfile.findUnique({
      where: { userId: req.user.id },
      select: { city: true, latitude: true, longitude: true },
    });
    kotaPembeli = profil?.city ?? null;
    if (profil) {
      lokasiPembeli = { kota: profil.city, lat: profil.latitude, lon: profil.longitude };
    }
  }

  const peta = new Map();

  for (const p of products) {
    const kunci = `${p.name.toLowerCase()}|${p.unit}`;
    const harga = Number(p.price);

    const grup = peta.get(kunci) ?? {
      nama: p.name,
      satuan: p.unit,
      kategori: p.category,
      penawaran: [],
      termurah: Number.POSITIVE_INFINITY,
      termahal: 0,
    };

    grup.penawaran.push({
      produkId: p.id,
      pemasokId: p.supplier?.id ?? null,
      pemasok: p.supplier?.groupName ?? 'Pemasok',
      kota: p.supplier?.city ?? null,
      harga,
      hargaGrosir: p.bulkPrice == null ? null : Number(p.bulkPrice),
      minGrosir: p.bulkMinQty,
      stok: p.stock,
      adaPesananTerbuka: adaOrder.has(p.id),
      pengiriman: lokasiPembeli
        ? hitungPengiriman(lokasiPembeli, {
            kota: p.supplier?.city,
            lat: p.supplier?.latitude,
            lon: p.supplier?.longitude,
          })
        : null,
    });

    grup.termurah = Math.min(grup.termurah, harga);
    grup.termahal = Math.max(grup.termahal, harga);
    peta.set(kunci, grup);
  }

  const komoditas = [...peta.values()]
    .map((g) => ({
      ...g,
      jumlahPemasok: g.penawaran.length,
      selisihHarga: Math.round(g.termahal - g.termurah),
    }))
    .sort((a, b) => b.jumlahPemasok - a.jumlahPemasok || a.nama.localeCompare(b.nama));

  // Pilihan filter ikut dikirim supaya browser tidak perlu menghitung
  const semua = await prisma.product.findMany({
    select: { category: true, supplier: { select: { city: true } } },
  });

  res.json({
    kotaPembeli,
    kategori: [...new Set(semua.map((x) => x.category))].sort(),
    kota: [...new Set(semua.map((x) => x.supplier?.city).filter(Boolean))].sort(),
    komoditas,
  });
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  katalogKomoditas,
};