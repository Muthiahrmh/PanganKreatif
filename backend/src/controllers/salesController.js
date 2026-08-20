const { z } = require('zod');
const prisma = require('../utils/prisma');

async function getMyUmkmProfile(userId) {
  return prisma.umkmProfile.findUnique({ where: { userId } });
}

async function listSalesRecords(req, res) {
  const umkmProfile = await getMyUmkmProfile(req.user.id);
  if (!umkmProfile) return res.status(403).json({ error: 'Bukan akun UMKM' });

  const records = await prisma.salesRecord.findMany({
    where: { umkmId: umkmProfile.id },
    orderBy: { date: 'desc' },
  });
  res.json(records);
}

const salesSchema = z.object({
  productName: z.string().min(1),
  quantity: z.number().positive(),
  date: z.string(), // ISO date
});

async function createSalesRecord(req, res) {
  const parsed = salesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const umkmProfile = await getMyUmkmProfile(req.user.id);
  if (!umkmProfile) return res.status(403).json({ error: 'Bukan akun UMKM' });

  const record = await prisma.salesRecord.create({
    data: {
      umkmId: umkmProfile.id,
      productName: parsed.data.productName,
      quantity: parsed.data.quantity,
      date: new Date(parsed.data.date),
    },
  });
  res.status(201).json(record);
}

// Bulk insert - buat import CSV data penjualan sekaligus
async function bulkCreateSalesRecords(req, res) {
  const arraySchema = z.array(salesSchema);
  const parsed = arraySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const umkmProfile = await getMyUmkmProfile(req.user.id);
  if (!umkmProfile) return res.status(403).json({ error: 'Bukan akun UMKM' });

  const result = await prisma.salesRecord.createMany({
    data: parsed.data.map((r) => ({
      umkmId: umkmProfile.id,
      productName: r.productName,
      quantity: r.quantity,
      date: new Date(r.date),
    })),
  });
  res.status(201).json({ count: result.count });
}

module.exports = { listSalesRecords, createSalesRecord, bulkCreateSalesRecords };
