const { z } = require('zod');
const prisma = require('../utils/prisma');
const { generateForecast: runModel, periodToDate } = require('../utils/forecasting');

async function getMyUmkmProfile(userId) {
  return prisma.umkmProfile.findUnique({ where: { userId } });
}

const generateSchema = z.object({
  productName: z.string().min(1),
});

/**
 * Buat prediksi kebutuhan satu bahan baku berdasarkan histori penjualan UMKM.
 * Seluruh perhitungan ada di utils/forecasting.js supaya cuma ada satu
 * sumber kebenaran — controller ini hanya mengurus data dan respons.
 */
async function generateForecast(req, res) {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const umkmProfile = await getMyUmkmProfile(req.user.id);
  if (!umkmProfile) return res.status(403).json({ error: 'Bukan akun UMKM' });

  const records = await prisma.salesRecord.findMany({
    where: { umkmId: umkmProfile.id, productName: parsed.data.productName },
    orderBy: { date: 'asc' },
  });

  if (records.length === 0) {
    return res.status(400).json({
      error: 'Belum ada data penjualan untuk bahan baku ini, tidak bisa membuat prediksi',
    });
  }

  const result = runModel(records);

  const forecast = await prisma.forecastResult.create({
    data: {
      umkmId: umkmProfile.id,
      productName: parsed.data.productName,
      predictedQuantity: result.predictedQuantity,
      period: periodToDate(result.period),
    },
  });

  res.status(201).json({
    forecast,
    detail: {
      // Nama field dipertahankan supaya tampilan lama tetap jalan
      monthlyTotals: result.monthlyHistory.map((m) => ({
        periodKey: m.period,
        quantity: m.quantity,
      })),
      ...result.detail,
    },
    algoritma: result.method,
  });
}

async function listForecasts(req, res) {
  const umkmProfile = await getMyUmkmProfile(req.user.id);
  if (!umkmProfile) return res.status(403).json({ error: 'Bukan akun UMKM' });

  const forecasts = await prisma.forecastResult.findMany({
    where: { umkmId: umkmProfile.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(forecasts);
}

module.exports = { generateForecast, listForecasts };