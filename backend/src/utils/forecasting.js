const { bobotLiburBulan, tahunTersedia } = require('./harilibur');
const { createNetwork, train, predict } = require('./neuralForecast');

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

/** Tanggal penjualan juga dibaca sebagai UTC supaya bulannya konsisten */
function periodKeyOf(date) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
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

/**
 * "2026-09" -> 1 September 2026 dalam UTC.
 * Wajib UTC: kolom period bertipe @db.Date, dan tanggal lokal WIB
 * akan tersimpan mundur satu hari sehingga bulannya ikut meleset.
 */
function periodToDate(period) {
  const [y, m] = period.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

// ---------- agregasi ----------

function aggregateMonthly(records) {
  const map = new Map();
  for (const r of records) {
    const key = periodKeyOf(r.date);
    map.set(key, (map.get(key) || 0) + Number(r.quantity));
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    // Dibulatkan 2 desimal supaya galat penjumlahan pecahan biner
    // tidak bocor ke tampilan sebagai 37.599999999999994
    .map(([period, quantity]) => ({
      period,
      quantity: Math.round(quantity * 100) / 100,
    }));
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

const HOLIDAY_WEIGHT_STEP = 0.08;
const HOLIDAY_FACTOR_CAP = 1.4;

/** Faktor hari libur untuk bulan target, sesuai Bab II proposal ("musim, hari libur"). */
function holidayAdjustment(targetPeriod) {
  const { bobot, daftar } = bobotLiburBulan(targetPeriod);

  if (bobot <= 0) {
    return {
      factor: 1,
      applied: false,
      list: [],
      note: 'Tidak ada hari libur nasional yang berdampak pada bulan target.',
    };
  }

  const factor = Math.min(1 + bobot * HOLIDAY_WEIGHT_STEP, HOLIDAY_FACTOR_CAP);
  const catatanTahun = tahunTersedia(targetPeriod)
    ? ''
    : ' Tanggal hari raya bergerak untuk tahun ini masih perkiraan.';

  return {
    factor: Math.round(factor * 1000) / 1000,
    applied: true,
    list: daftar,
    note: `Bulan target bertepatan dengan ${daftar.join(', ')}, permintaan diperkirakan naik.${catatanTahun}`,
  };
}

// ---------- jaringan saraf tiruan ----------

const MIN_SAMPLES_FOR_AI = 4; // butuh minimal 6 bulan data (indeks 2..5)
const AI_HIDDEN_UNITS = 5;
const AI_ENSEMBLE_SIZE = 3; // dilatih beberapa kali, hasilnya dirata-ratakan supaya lebih stabil
const AI_EPOCHS = 500;
const AI_LEARNING_RATE = 0.4;
const AI_WEIGHT = 0.6; // porsi hasil jaringan saraf dalam prediksi akhir

function pointInTimeFeatures(monthly, i) {
  const dataSebelumnya = monthly.slice(0, i);
  const nilaiSebelumnya = dataSebelumnya.map((m) => m.quantity);
  const titikSebelumnya = dataSebelumnya.map((m) => ({
    x: periodToIndex(m.period),
    y: m.quantity,
  }));
  const targetX = periodToIndex(monthly[i].period);

  const ma = movingAverage(nilaiSebelumnya, 3);
  const trend = linearTrendAt(titikSebelumnya, targetX);

  let seasonal = 1;
  if (dataSebelumnya.length >= 6) {
    const idx = seasonalIndex(dataSebelumnya);
    const f = idx?.get(monthOf(monthly[i].period));
    if (f && Number.isFinite(f)) seasonal = Math.min(Math.max(f, 0.7), 1.3);
  }

  const holiday = holidayAdjustment(monthly[i].period).factor;

  return { ma, trend, seasonal, holiday };
}

function normalisasiFitur({ ma, trend, seasonal, holiday }, divisor) {
  return [ma / divisor, trend / divisor, seasonal - 1, holiday - 1];
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

/**
 * Melatih jaringan saraf kecil dari histori bulanan UMKM sendiri lalu
 * memprediksi periode target. Setiap bulan dalam histori dipakai sebagai
 * satu contoh latih: fiturnya dihitung dari bulan-bulan SEBELUM bulan itu,
 * targetnya adalah kuantitas aktual bulan itu — persis meniru situasi
 * "meramal masa depan" tapi dengan jawaban yang sudah diketahui.
 */
function aiAdjustment(monthly, targetPeriod) {
  const contoh = [];
  for (let i = 2; i < monthly.length; i++) {
    contoh.push({ fitur: pointInTimeFeatures(monthly, i), target: monthly[i].quantity });
  }

  if (contoh.length < MIN_SAMPLES_FOR_AI) {
    return { applied: false, prediction: null, samples: contoh.length };
  }

  const scale = Math.max(1, ...monthly.map((m) => m.quantity));
  const divisor = scale * 1.5; // beri ruang untuk tren yang melebihi puncak historis

  const dataLatih = contoh.map(({ fitur, target }) => ({
    input: normalisasiFitur(fitur, divisor),
    target: clamp01(target / divisor),
  }));

  // Fitur periode target dihitung dengan fungsi yang sama, dengan menambahkan
  // periode target sebagai "titik semu" di ujung array — supaya rumusnya
  // konsisten dengan yang dipakai saat melatih, satu sumber kebenaran.
  const monthlyDenganTarget = [...monthly, { period: targetPeriod, quantity: 0 }];
  const inputTarget = normalisasiFitur(
    pointInTimeFeatures(monthlyDenganTarget, monthly.length),
    divisor
  );

  const hasilEnsemble = [];
  for (let e = 0; e < AI_ENSEMBLE_SIZE; e++) {
    const net = createNetwork(4, AI_HIDDEN_UNITS);
    train(net, dataLatih, { epochs: AI_EPOCHS, learningRate: AI_LEARNING_RATE });
    hasilEnsemble.push(predict(net, inputTarget));
  }

  const rataRata = hasilEnsemble.reduce((a, b) => a + b, 0) / hasilEnsemble.length;

  return {
    applied: true,
    prediction: Math.max(0, rataRata * divisor),
    samples: contoh.length,
    ensembleSize: AI_ENSEMBLE_SIZE,
  };
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

  const holiday = holidayAdjustment(targetPeriod);
  if (holiday.applied) method += '+holiday';

  const statistik = base * seasonalFactor * holiday.factor;

  // Jaringan saraf tiruan dilatih dari histori UMKM sendiri; hasil statistik
  // di atas tetap dipakai penuh kalau datanya belum cukup untuk melatih.
  const ai = aiAdjustment(monthly, targetPeriod);
  let final = statistik;
  if (ai.applied) {
    final = statistik * (1 - AI_WEIGHT) + ai.prediction * AI_WEIGHT;
    method += '+neural_network';
  }

  const predictedQuantity = Math.max(0, Math.round(final * 100) / 100);

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
      holidayFactor: holiday.factor,
      holidayApplied: holiday.applied,
      holidayList: holiday.list,
      holidayNote: holiday.note,
      statisticalPrediction: Math.round(statistik * 100) / 100,
      aiApplied: ai.applied,
      aiPrediction: ai.applied ? Math.round(ai.prediction * 100) / 100 : null,
      aiSamples: ai.samples,
      aiWeight: ai.applied ? AI_WEIGHT : 0,
      monthsOfData: monthly.length,
      lastDataPeriod: lastPeriod,
      keterangan: ai.applied
        ? `Prediksi hybrid: ${Math.round(AI_WEIGHT * 100)}% jaringan saraf tiruan (dilatih dari ${ai.samples} titik data) + ${Math.round((1 - AI_WEIGHT) * 100)}% model statistik.`
        : `Model AI butuh minimal ${MIN_SAMPLES_FOR_AI + 2} bulan data untuk mulai belajar (saat ini ${monthly.length}), jadi masih pakai model statistik.`,
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
  periodKeyOf,
  resolveTargetPeriod,
  periodToDate,
  periodToIndex,
  indexToPeriod,
};