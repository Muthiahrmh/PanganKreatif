/**
 * Peramalan kebutuhan bahan baku PanganKreatif.
 *
 * Pendekatan: time-series statistik klasik, bukan machine learning.
 *   1. Moving average 3 bulan  -> meredam fluktuasi jangka pendek
 *   2. Regresi linear (OLS)    -> menangkap arah tren
 *   3. Indeks musiman          -> menyesuaikan pola bulanan berulang
 *
 * Indeks musiman hanya dipakai kalau data historis sudah >= 24 bulan,
 * karena di bawah itu pola musiman belum bisa dibedakan dari kebetulan.
 */

// ---------- util periode ----------

const pad = (n) => String(n).padStart(2, '0');

/** "2026-03" -> jumlah bulan absolut sejak tahun 0, dipakai sebagai sumbu X */
function periodToIndex(period) {
  const [y, m] = period.split('-').map(Number);
  return y * 12 + (m - 1);
}

function indexToPeriod(index) {
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  return `${y}-${pad(m)}`;
}

function monthOf(period) {
  return Number(period.split('-')[1]);
}

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

function nextPeriod(lastPeriod) {
  if (!lastPeriod) {
    return indexToPeriod(periodToIndex(currentPeriod()) + 1);
  }
  return indexToPeriod(periodToIndex(lastPeriod) + 1);
}

/**
 * Periode yang diprediksi: satu bulan setelah data terakhir ATAU
 * setelah bulan berjalan, mana yang lebih baru. Kalau data berhenti
 * di Juni sementara sekarang Agustus, memprediksi Juli tidak ada gunanya.
 */
function resolveTargetPeriod(lastPeriod) {
  const fromData = periodToIndex(lastPeriod);
  const fromNow = periodToIndex(currentPeriod());
  return indexToPeriod(Math.max(fromData, fromNow) + 1);
}

/** "2026-09" -> Date(2026, 8, 1), untuk disimpan ke kolom period */
function periodToDate(period) {
  const [y, m] = period.split('-').map(Number);
  return new Date(y, m - 1, 1);
}

// ---------- agregasi ----------

function aggregateMonthly(records) {
  const map = new Map();
  for (const r of records) {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    map.set(key, (map.get(key) || 0) + Number(r.quantity));
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, quantity]) => ({ period, quantity }));
}

// ---------- metode ----------

function movingAverage(values, window = 3) {
  if (values.length === 0) return 0;
  const slice = values.slice(-window);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

/**
 * Regresi linear kuadrat terkecil.
 * points: [{ x, y }] — x memakai indeks bulan absolut supaya bulan yang
 * bolong tetap dihitung sebagai jarak, bukan dianggap berurutan.
 */
function linearTrendAt(points, targetX) {
  const n = points.length;
  if (n === 0) return 0;
  if (n === 1) return points[0].y;

  const meanX = points.reduce((a, p) => a + p.x, 0) / n;
  const meanY = points.reduce((a, p) => a + p.y, 0) / n;

  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - meanX) * (p.y - meanY);
    den += (p.x - meanX) ** 2;
  }

  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  return intercept + slope * targetX;
}

/** Versi lama dipertahankan supaya kode yang sudah memanggilnya tetap jalan */
function linearTrend(values) {
  const points = values.map((y, i) => ({ x: i, y }));
  return linearTrendAt(points, values.length);
}

/**
 * Indeks musiman per bulan: rata-rata rasio nilai bulan tertentu
 * terhadap rata-rata keseluruhan. Nilai 1,2 berarti bulan itu
 * biasanya 20% lebih tinggi dari rata-rata.
 */
function seasonalIndex(monthly) {
  const overallMean =
    monthly.reduce((a, m) => a + m.quantity, 0) / monthly.length;
  if (overallMean === 0) return null;

  const byMonth = new Map();
  for (const m of monthly) {
    const key = monthOf(m.period);
    const arr = byMonth.get(key) || [];
    arr.push(m.quantity / overallMean);
    byMonth.set(key, arr);
  }

  const index = new Map();
  for (const [month, ratios] of byMonth) {
    index.set(month, ratios.reduce((a, b) => a + b, 0) / ratios.length);
  }
  return index;
}

// ---------- fungsi utama ----------

const MIN_MONTHS_FOR_SEASONALITY = 24;

/**
 * @param {Array<{date: Date|string, quantity: number}>} salesRecords
 * @returns {{ predictedQuantity: number, period: string, method: string, monthlyHistory: Array, detail: object }}
 */
function generateForecast(salesRecords, options = {}) {
  const monthly = aggregateMonthly(salesRecords);

  if (monthly.length === 0) {
    return {
      predictedQuantity: 0,
      period: nextPeriod(null),
      method: 'no_data',
      monthlyHistory: [],
      detail: {
        keterangan: 'Belum ada data penjualan untuk diprediksi.',
        seasonalityApplied: false,
      },
    };
  }

  const values = monthly.map((m) => m.quantity);
  const lastPeriod = monthly[monthly.length - 1].period;
  const targetPeriod = options.targetPeriod || resolveTargetPeriod(lastPeriod);
  const targetX = periodToIndex(targetPeriod);

  const ma = movingAverage(values, 3);

  const points = monthly.map((m) => ({ x: periodToIndex(m.period), y: m.quantity }));
  const trend = linearTrendAt(points, targetX);

  // Basis prediksi
  let base;
  let method;
  if (monthly.length < 3) {
    base = ma;
    method = 'moving_average';
  } else {
    base = ma * 0.5 + trend * 0.5;
    method = 'moving_average+linear_trend';
  }

  // Penyesuaian musiman, hanya kalau datanya cukup panjang
  let seasonalFactor = 1;
  let seasonalityApplied = false;

  if (monthly.length >= MIN_MONTHS_FOR_SEASONALITY) {
    const index = seasonalIndex(monthly);
    const factor = index?.get(monthOf(targetPeriod));
    if (factor && Number.isFinite(factor)) {
      // Dibatasi 0,7-1,3 supaya satu bulan ekstrem tidak merusak prediksi
      seasonalFactor = Math.min(Math.max(factor, 0.7), 1.3);
      seasonalityApplied = true;
      method += '+seasonal';
    }
  }

  const predicted = base * seasonalFactor;
  const predictedQuantity = Math.max(0, Math.round(predicted * 100) / 100);

  return {
    predictedQuantity,
    period: targetPeriod,
    method,
    monthlyHistory: monthly,
    detail: {
      movingAverage: Math.round(ma * 100) / 100,
      linearTrend: Math.round(trend * 100) / 100,
      seasonalFactor: Math.round(seasonalFactor * 1000) / 1000,
      seasonalityApplied,
      monthsOfData: monthly.length,
      lastDataPeriod: lastPeriod,
      keterangan: seasonalityApplied
        ? 'Prediksi memperhitungkan tren dan pola musiman bulanan.'
        : `Pola musiman belum dihitung, butuh minimal ${MIN_MONTHS_FOR_SEASONALITY} bulan data (saat ini ${monthly.length}).`,
    },
  };
}

module.exports = {
  generateForecast,
  aggregateMonthly,
  movingAverage,
  linearTrend,
  linearTrendAt,
  seasonalIndex,
  nextPeriod,
  resolveTargetPeriod,
  periodToDate,
  periodToIndex,
  indexToPeriod,
};