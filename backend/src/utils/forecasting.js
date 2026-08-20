/**
 * Forecasting AI Demand Forecasting (versi awal): moving average + linear trend.
 * Didesain biar gampang di-upgrade ke Python microservice (Prophet/scikit-learn) nanti,
 * tanpa ubah kontrak input/output (productName -> predictedQuantity per period).
 */

// Kelompokkan sales_records per bulan (YYYY-MM), jumlahkan quantity
function aggregateMonthly(records) {
  const map = new Map();
  for (const r of records) {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    map.set(key, (map.get(key) || 0) + Number(r.quantity));
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([period, quantity]) => ({ period, quantity }));
}

// Rata-rata bergerak dari N periode terakhir
function movingAverage(values, window = 3) {
  if (values.length === 0) return 0;
  const slice = values.slice(-window);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / slice.length;
}

// Regresi linear sederhana (least squares) -> prediksi titik berikutnya
function linearTrend(values) {
  const n = values.length;
  if (n === 0) return 0;
  if (n === 1) return values[0];

  const xs = values.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (values[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  const nextX = n; // titik berikutnya setelah data terakhir
  return intercept + slope * nextX;
}

function nextPeriod(lastPeriod) {
  if (!lastPeriod) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`;
  }
  const [y, m] = lastPeriod.split('-').map(Number);
  const d = new Date(y, m, 1); // m sudah 1-indexed jadi otomatis maju 1 bulan
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * @param {Array<{date: Date|string, quantity: number}>} salesRecords
 * @returns {{ predictedQuantity: number, period: string, method: string, monthlyHistory: Array }}
 */
function generateForecast(salesRecords) {
  const monthly = aggregateMonthly(salesRecords);
  const values = monthly.map((m) => m.quantity);

  if (values.length === 0) {
    return {
      predictedQuantity: 0,
      period: nextPeriod(null),
      method: 'no_data',
      monthlyHistory: [],
    };
  }

  const ma = movingAverage(values, 3);
  const trend = linearTrend(values);

  // Blend: kalau data masih sedikit (<3 bulan), andalkan moving average.
  // Kalau data cukup, gabung 50/50 biar sensitif ke tren tapi tetap stabil.
  const predicted = values.length < 3 ? ma : ma * 0.5 + trend * 0.5;
  const predictedQuantity = Math.max(0, Math.round(predicted * 100) / 100);

  const lastPeriod = monthly[monthly.length - 1].period;

  return {
    predictedQuantity,
    period: nextPeriod(lastPeriod),
    method: values.length < 3 ? 'moving_average' : 'moving_average+linear_trend',
    monthlyHistory: monthly,
  };
}

module.exports = { generateForecast, aggregateMonthly, movingAverage, linearTrend };
