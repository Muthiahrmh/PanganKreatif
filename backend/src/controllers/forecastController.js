const { z } = require('zod');
const prisma = require('../utils/prisma');

async function getMyUmkmProfile(userId) {
  return prisma.umkmProfile.findUnique({ where: { userId } });
}

function runForecastModel(monthlyTotals) {
  // monthlyTotals: [{ periodKey: '2026-01', quantity: number }, ...] urut kronologis
  if (monthlyTotals.length === 0) return 0;

  const last3 = monthlyTotals.slice(-3);
  const movingAvg = last3.reduce((sum, m) => sum + m.quantity, 0) / last3.length;

  if (monthlyTotals.length < 2) return Math.max(0, Math.round(movingAvg));

  // Linear regression sederhana (x = index bulan, y = quantity)
  const n = monthlyTotals.length;
  const xs = monthlyTotals.map((_, i) => i);
  const ys = monthlyTotals.map((m) => m.quantity);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  const numerator = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i] - yMean), 0);
  const denominator = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  const trendPrediction = intercept + slope * n; // proyeksi bulan berikutnya

  // Kombinasi: rata-rata dari moving average & tren, biar gak terlalu liar ikut tren
  const combined = (movingAvg + trendPrediction) / 2;
  return Math.max(0, Math.round(combined));
}

function groupSalesByMonth(records) {
  const map = new Map();
  for (const r of records) {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    map.set(key, (map.get(key) || 0) + Number(r.quantity));
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([periodKey, quantity]) => ({ periodKey, quantity }));
}

function nextMonthDate(fromDate = new Date()) {
  return new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 1);
}

const generateSchema = z.object({
  productName: z.string().min(1),
});

// Generate forecast utk satu jenis bahan baku berdasarkan histori sales_records milik UMKM tsb
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

  const monthlyTotals = groupSalesByMonth(records);
  const predictedQuantity = runForecastModel(monthlyTotals);
  const period = nextMonthDate();

  const forecast = await prisma.forecastResult.create({
    data: {
      umkmId: umkmProfile.id,
      productName: parsed.data.productName,
      predictedQuantity,
      period,
    },
  });

  res.status(201).json({
    forecast,
    detail: { monthlyTotals, algoritma: 'moving_average_3bulan + tren_linear' },
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