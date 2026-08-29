/**
 * Jarak antarwilayah dan estimasi pengiriman.
 *
 * Melengkapi fitur perbandingan pemasok pada Tabel 2.1 proposal,
 * yang menyebut perbandingan "harga, ketersediaan stok, jarak, dan
 * estimasi pengiriman".
 *
 * Koordinat memakai titik pusat kabupaten/kota, jadi jaraknya
 * perkiraan antarwilayah — bukan jarak alamat ke alamat. Untuk
 * pengadaan bahan baku antarkabupaten, ketelitian ini memadai.
 *
 * Cakupan sengaja dua lapis: kabupaten/kota di Aceh dilengkapi penuh
 * karena itu basis operasional tahun pertama (Tabel 3.1 proposal),
 * sedangkan wilayah lain dilengkapi sampai level ibu kota
 * provinsi/kota besar — cukup untuk perbandingan pemasok lintas
 * provinsi begitu ekspansi ke luar Aceh dimulai (target Executive
 * Summary: lima kota besar dalam tiga tahun), tanpa bergantung pada
 * API peta eksternal yang menambah risiko latensi/rate-limit pada
 * halaman katalog yang sering diakses.
 */

/** Titik pusat kabupaten/kota di Aceh — basis operasional tahun pertama */
const KOORDINAT_ACEH = {
    Lhokseumawe: { lat: 5.1801, lon: 97.1507 },
    'Aceh Utara': { lat: 5.0553, lon: 97.3186 },
    Bireuen: { lat: 5.203, lon: 96.7009 },
    'Bener Meriah': { lat: 4.7361, lon: 96.8617 },
    'Aceh Tengah': { lat: 4.5194, lon: 96.8556 },
    Pidie: { lat: 5.3806, lon: 95.9569 },
    'Pidie Jaya': { lat: 5.1547, lon: 96.2103 },
    'Aceh Timur': { lat: 4.6333, lon: 97.7833 },
    Langsa: { lat: 4.4683, lon: 97.9683 },
    'Aceh Tamiang': { lat: 4.2833, lon: 98.0167 },
    'Banda Aceh': { lat: 5.5483, lon: 95.3238 },
    'Aceh Besar': { lat: 5.4508, lon: 95.4636 },
    Sabang: { lat: 5.8933, lon: 95.3214 },
    'Aceh Jaya': { lat: 4.8, lon: 95.6333 },
    'Aceh Barat': { lat: 4.45, lon: 96.1667 },
    'Nagan Raya': { lat: 4.1667, lon: 96.35 },
    'Aceh Barat Daya': { lat: 3.7333, lon: 96.8333 },
    'Aceh Selatan': { lat: 3.3, lon: 97.1 },
    'Gayo Lues': { lat: 3.95, lon: 97.35 },
    Subulussalam: { lat: 2.65, lon: 98.0 },
    'Aceh Singkil': { lat: 2.2833, lon: 97.7833 },
    Simeulue: { lat: 2.6167, lon: 96.0833 },
};

/** Kota besar/ibu kota provinsi di luar Aceh, untuk ekspansi antarwilayah */
const KOORDINAT_NASIONAL = {
    // Sumatera
    Medan: { lat: 3.5952, lon: 98.6722 },
    Pekanbaru: { lat: 0.5071, lon: 101.4478 },
    Batam: { lat: 1.0456, lon: 104.0305 },
    'Tanjung Pinang': { lat: 0.9186, lon: 104.4562 },
    Padang: { lat: -0.9471, lon: 100.4172 },
    Jambi: { lat: -1.6101, lon: 103.6131 },
    Palembang: { lat: -2.9761, lon: 104.7754 },
    Bengkulu: { lat: -3.7928, lon: 102.2608 },
    'Bandar Lampung': { lat: -5.4292, lon: 105.261 },
    'Pangkal Pinang': { lat: -2.1316, lon: 106.1169 },

    // Jawa & sekitarnya
    Jakarta: { lat: -6.2088, lon: 106.8456 },
    'DKI Jakarta': { lat: -6.2088, lon: 106.8456 },
    Bogor: { lat: -6.5971, lon: 106.806 },
    Depok: { lat: -6.4025, lon: 106.7942 },
    Tangerang: { lat: -6.1783, lon: 106.6319 },
    Bekasi: { lat: -6.2383, lon: 106.9756 },
    Serang: { lat: -6.1149, lon: 106.1503 },
    Bandung: { lat: -6.9175, lon: 107.6191 },
    Semarang: { lat: -6.9932, lon: 110.4203 },
    Surakarta: { lat: -7.5755, lon: 110.8243 },
    Solo: { lat: -7.5755, lon: 110.8243 },
    Yogyakarta: { lat: -7.7956, lon: 110.3695 },
    Jogja: { lat: -7.7956, lon: 110.3695 },
    Surabaya: { lat: -7.2575, lon: 112.7521 },
    Malang: { lat: -7.9666, lon: 112.6326 },

    // Bali & Nusa Tenggara
    Denpasar: { lat: -8.6705, lon: 115.2126 },
    Mataram: { lat: -8.5833, lon: 116.1167 },
    Kupang: { lat: -10.1772, lon: 123.607 },

    // Kalimantan
    Pontianak: { lat: -0.0263, lon: 109.3425 },
    Palangkaraya: { lat: -2.2096, lon: 113.9213 },
    Banjarmasin: { lat: -3.3186, lon: 114.5944 },
    Samarinda: { lat: -0.5022, lon: 117.1536 },
    Balikpapan: { lat: -1.2379, lon: 116.8529 },
    'Tanjung Selor': { lat: 2.8385, lon: 117.3616 },

    // Sulawesi
    Manado: { lat: 1.4748, lon: 124.8421 },
    Palu: { lat: -0.8917, lon: 119.8707 },
    Makassar: { lat: -5.1477, lon: 119.4327 },
    Kendari: { lat: -3.9985, lon: 122.5127 },
    Gorontalo: { lat: 0.5435, lon: 123.0568 },
    Mamuju: { lat: -2.6748, lon: 118.8885 },

    // Maluku & Papua
    Ambon: { lat: -3.6954, lon: 128.1814 },
    Ternate: { lat: 0.7833, lon: 127.3667 },
    Jayapura: { lat: -2.5337, lon: 140.7181 },
    Manokwari: { lat: -0.8615, lon: 134.062 },
    Sorong: { lat: -0.8762, lon: 131.2558 },
};

const KOORDINAT = { ...KOORDINAT_ACEH, ...KOORDINAT_NASIONAL };

const RAD = Math.PI / 180;

/** Jarak garis lurus dua titik di permukaan bumi, dalam kilometer */
function haversine(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * RAD;
    const dLon = (b.lon - a.lon) * RAD;

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(h));
}

function cariKoordinat(nama) {
    if (!nama) return null;
    const bersih = String(nama).replace(/^(kota|kabupaten|kab\.?)\s+/i, '').trim();

    if (KOORDINAT[bersih]) return KOORDINAT[bersih];

    const cocok = Object.keys(KOORDINAT).find(
        (k) => k.toLowerCase() === bersih.toLowerCase()
    );
    return cocok ? KOORDINAT[cocok] : null;
}

/**
 * Jarak tempuh perkiraan.
 * Jarak garis lurus dikalikan 1,3 sebagai perkiraan kasar jalan
 * darat yang berkelok — lazim dipakai untuk taksiran cepat.
 */
const FAKTOR_JALAN = 1.3;

/**
 * Estimasi pengiriman berdasarkan jarak.
 *
 * Angka ini asumsi operasional, bukan janji dari kurir. Untuk bahan
 * pangan segar, pengiriman dalam kota biasanya bisa hari yang sama.
 */
function estimasiKirim(km) {
    if (km <= 15) return { hari: 0, label: 'Hari yang sama', catatan: 'Dalam kota' };
    if (km <= 60) return { hari: 1, label: '1 hari', catatan: 'Kabupaten tetangga' };
    if (km <= 150) return { hari: 2, label: '1-2 hari', catatan: 'Lintas kabupaten' };
    if (km <= 300) return { hari: 3, label: '2-3 hari', catatan: 'Lintas wilayah' };
    if (km <= 750) return { hari: 5, label: '3-5 hari', catatan: 'Lintas provinsi' };
    if (km <= 1500) return { hari: 7, label: '5-7 hari', catatan: 'Lintas pulau' };
    return { hari: 14, label: '7-14 hari', catatan: 'Lintas pulau jauh' };
}

function koordinatValid(lat, lon) {
    return Number.isFinite(lat) && Number.isFinite(lon);
}

/**
 * Hitung jarak dan estimasi pengiriman antara dua lokasi.
 *
 * Menerima kota (string) untuk kompatibilitas lama, atau objek
 * { kota, lat, lon } kalau ada hasil geocoding alamat yang presisi.
 * Kalau kedua sisi punya koordinat presisi, jaraknya dihitung dari
 * alamat ke alamat asli, bukan sekadar titik pusat kota.
 *
 * @param {string|{kota: string, lat?: number|null, lon?: number|null}} asal
 * @param {string|{kota: string, lat?: number|null, lon?: number|null}} tujuan
 * @returns {null|{km: number, estimasi: object, samaKota: boolean, presisi: boolean}}
 */
function hitungPengiriman(asal, tujuan) {
    const a0 = typeof asal === 'string' ? { kota: asal } : asal;
    const b0 = typeof tujuan === 'string' ? { kota: tujuan } : tujuan;
    if (!a0?.kota || !b0?.kota) return null;

    const presisiAsal = koordinatValid(a0.lat, a0.lon);
    const presisiTujuan = koordinatValid(b0.lat, b0.lon);

    const a = presisiAsal ? { lat: a0.lat, lon: a0.lon } : cariKoordinat(a0.kota);
    const b = presisiTujuan ? { lat: b0.lat, lon: b0.lon } : cariKoordinat(b0.kota);
    if (!a || !b) return null;

    // Sama kota dianggap cukup dari nama kotanya saja, terlepas dari
    // presisi koordinat — dua alamat di kota yang sama tetap "dalam kota"
    // meskipun jaraknya secara teknis tidak nol.
    const samaKota = String(a0.kota).toLowerCase().trim() === String(b0.kota).toLowerCase().trim();

    const lurus = haversine(a, b);
    const km = samaKota && !(presisiAsal && presisiTujuan)
        ? 0
        : Math.round(lurus * FAKTOR_JALAN);

    return {
        km,
        samaKota,
        // true kalau jaraknya dihitung dari alamat ke alamat asli (geocoding),
        // false kalau masih perkiraan titik-pusat-kota
        presisi: presisiAsal && presisiTujuan,
        estimasi:
            samaKota && !(presisiAsal && presisiTujuan)
                ? { hari: 0, label: 'Hari yang sama', catatan: 'Satu kota' }
                : estimasiKirim(km),
    };
}

module.exports = { hitungPengiriman, cariKoordinat, haversine, KOORDINAT };