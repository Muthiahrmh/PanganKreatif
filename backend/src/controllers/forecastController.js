const { z } = require('zod');
const prisma = require('../utils/prisma');
const { generateForecast: runModel, periodToDate } = require('../utils/forecasting');
const { resolveUnitPrice, toNum } = require('../utils/pricing');

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

/**
 * GET /api/forecasts/rekomendasi
 *
 * Smart Purchasing Recommendation (Tabel 2.1 proposal).
 *
 * Menyambungkan tiga hal yang selama ini terpisah: hasil prediksi
 * kebutuhan, pesanan kolektif yang sedang terbuka, dan pemasok
 * termurah. Keluarannya berupa saran tindakan, bukan sekadar angka.
 */
async function getRekomendasi(req, res) {
  const umkmProfile = await getMyUmkmProfile(req.user.id);
  if (!umkmProfile) return res.status(403).json({ error: 'Bukan akun UMKM' });

  const records = await prisma.salesRecord.findMany({
    where: { umkmId: umkmProfile.id },
    orderBy: { date: 'asc' },
  });

  if (records.length === 0) {
    return res.json({ siap: false, alasan: 'belum_ada_penjualan', rekomendasi: [] });
  }

  // Kelompokkan per bahan baku, ambil yang volumenya paling besar
  const perBahan = new Map();
  for (const r of records) {
    const arr = perBahan.get(r.productName) || [];
    arr.push(r);
    perBahan.set(r.productName, arr);
  }

  const urutBahan = [...perBahan.entries()]
    .map(([nama, rows]) => ({
      nama,
      rows,
      volume: rows.reduce((s, r) => s + toNum(r.quantity), 0),
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 4);

  // Ambil sekali untuk semua bahan, hindari kueri berulang
  const namaBahan = urutBahan.map((b) => b.nama);

  const produkTerkait = await prisma.product.findMany({
    where: { name: { in: namaBahan } },
    include: { supplier: { select: { id: true, groupName: true, city: true } } },
  });

  const pesananTerbuka = await prisma.procurementOrder.findMany({
    where: { status: 'open', product: { name: { in: namaBahan } } },
    include: {
      product: { include: { supplier: { select: { groupName: true, city: true } } } },
      items: { select: { umkmId: true, quantity: true } },
    },
  });

  const rekomendasi = [];

  for (const bahan of urutBahan) {
    const hasil = runModel(bahan.rows);
    const prediksi = hasil.predictedQuantity;

    // Bandingkan dengan rata-rata tiga bulan terakhir
    const bulanan = hasil.monthlyHistory.map((m) => m.quantity);
    const terakhir = bulanan.slice(-3);
    const rata = terakhir.length
      ? terakhir.reduce((a, b) => a + b, 0) / terakhir.length
      : 0;
    const selisihPersen = rata > 0 ? ((prediksi - rata) / rata) * 100 : 0;
    const arah =
      Math.abs(selisihPersen) < 5 ? 'stabil' : selisihPersen > 0 ? 'naik' : 'turun';

    const kandidatProduk = produkTerkait.filter((p) => p.name === bahan.nama);
    if (kandidatProduk.length === 0) continue;

    const termurah = kandidatProduk.reduce((a, b) =>
      toNum(a.price) <= toNum(b.price) ? a : b
    );

    // Pesanan kolektif untuk bahan ini, pilih yang paling dekat ke harga grosir
    const kandidatPesanan = pesananTerbuka
      .filter((o) => o.product.name === bahan.nama)
      .map((o) => {
        const harga = resolveUnitPrice(o.product, o.totalQuantity);
        return {
          orderId: o.id,
          supplier: o.product.supplier.groupName,
          kota: o.product.supplier.city,
          satuan: o.product.unit,
          deadline: o.deadline,
          terkumpul: toNum(o.totalQuantity),
          peserta: o.items.length,
          sudahGabung: o.items.some((it) => it.umkmId === umkmProfile.id),
          hargaNormal: harga.normalPrice,
          hargaGrosir: harga.bulkPrice,
          hargaBerlaku: harga.unitPrice,
          minGrosir: harga.bulkMinQty,
          sisaKeGrosir: harga.remainingToBulk,
          grosirAktif: harga.isBulkActive,
          hematPerUnit: harga.bulkPrice ? harga.normalPrice - harga.bulkPrice : 0,
        };
      })
      .sort((a, b) => {
        if (a.grosirAktif !== b.grosirAktif) return a.grosirAktif ? -1 : 1;
        return a.sisaKeGrosir - b.sisaKeGrosir;
      });

    const pesanan = kandidatPesanan[0] ?? null;

    // Potensi hemat kalau memakai pesanan kolektif dibanding beli satuan termurah
    const potensiHemat = pesanan?.hargaGrosir
      ? Math.round(prediksi * (toNum(termurah.price) - pesanan.hargaGrosir))
      : 0;

    let tindakan = 'pantau';
    if (pesanan && !pesanan.sudahGabung) tindakan = 'gabung';
    else if (pesanan && pesanan.sudahGabung) tindakan = 'sudah_gabung';
    else if (arah === 'naik') tindakan = 'cari_pemasok';

    rekomendasi.push({
      bahan: bahan.nama,
      satuan: termurah.unit,
      prediksi,
      periode: hasil.period,
      rataRata: Math.round(rata * 10) / 10,
      arah,
      persen: Math.abs(Math.round(selisihPersen)),
      musimanAktif: hasil.detail.seasonalityApplied,
      pemasokTermurah: {
        groupName: termurah.supplier.groupName,
        kota: termurah.supplier.city,
        harga: toNum(termurah.price),
        jumlahPemasok: kandidatProduk.length,
      },
      pesanan,
      potensiHemat,
      tindakan,
    });
  }

  // Yang paling mendesak di atas: ada pesanan yang bisa digabung
  const urutan = { gabung: 0, cari_pemasok: 1, sudah_gabung: 2, pantau: 3 };
  rekomendasi.sort((a, b) => urutan[a.tindakan] - urutan[b.tindakan]);

  res.json({ siap: true, rekomendasi });
}

module.exports = { generateForecast, listForecasts, getRekomendasi };