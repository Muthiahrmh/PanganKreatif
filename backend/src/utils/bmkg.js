/**
 * Integrasi prakiraan cuaca BMKG (data terbuka, tanpa API key).
 *
 * Dipakai sebagai PERINGATAN RISIKO RANTAI PASOK jangka pendek,
 * bukan sebagai input model prediksi kebutuhan bulanan.
 * Alasannya: BMKG hanya menyediakan prakiraan 3 hari ke depan,
 * sedangkan prediksi kebutuhan bersifat bulanan. Menggabungkan
 * keduanya tanpa data cuaca historis tidak punya dasar statistik.
 *
 * Endpoint: https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=<kode>
 * Kode wilayah mengikuti kode Kemendagri sampai tingkat kelurahan/desa.
 */

const BMKG_BASE = 'https://api.bmkg.go.id/publik/prakiraan-cuaca';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 jam, BMKG memperbarui tidak sesering itu

const cache = new Map();

/**
 * Peta kode wilayah dibaca langsung dari .env, jadi menambah kota
 * cukup dengan menambah baris BMKG_ADM4_<NAMA_KOTA> tanpa ubah kode.
 * Contoh: BMKG_ADM4_BANDA_ACEH=11.71
 */
function bacaPetaWilayah() {
    const peta = new Map();
    for (const [key, value] of Object.entries(process.env)) {
        const cocok = key.match(/^BMKG_ADM4?_(.+)$/);
        if (!cocok || !value) continue;
        const nama = cocok[1];
        if (nama === 'DEFAULT') continue;
        peta.set(normalisasiNama(nama), value.trim());
    }
    return peta;
}

function normalisasiNama(teks) {
    return String(teks).toLowerCase().replace(/[_\s-]+/g, ' ').trim();
}

const KODE_WILAYAH = bacaPetaWilayah();
const KODE_DEFAULT = (process.env.BMKG_ADM4_DEFAULT || '').trim();

function kodeUntukKota(kota) {
    if (!kota) return KODE_DEFAULT;

    const cari = normalisasiNama(kota);
    if (KODE_WILAYAH.has(cari)) return KODE_WILAYAH.get(cari);

    // Cocokkan longgar, misal profil tertulis "Kota Lhokseumawe"
    for (const [nama, kode] of KODE_WILAYAH) {
        if (cari.includes(nama) || nama.includes(cari)) return kode;
    }
    return KODE_DEFAULT;
}

/**
 * BMKG memakai parameter berbeda tergantung tingkat wilayah.
 * 11        -> adm1 (provinsi)
 * 11.73     -> adm2 (kabupaten/kota)
 * 11.73.01  -> adm3 (kecamatan)
 * 11.73.01.1001 -> adm4 (kelurahan/desa)
 */
function paramUntukKode(kode) {
    const segmen = String(kode).split('.').filter(Boolean).length;
    return `adm${Math.min(Math.max(segmen, 1), 4)}`;
}

/** Kata kunci cuaca yang berisiko mengganggu panen dan pengiriman */
const RISIKO = [
    { kunci: ['hujan lebat', 'hujan sangat lebat', 'hujan ekstrem'], tingkat: 'tinggi' },
    { kunci: ['hujan petir', 'petir', 'badai'], tingkat: 'tinggi' },
    { kunci: ['hujan sedang'], tingkat: 'sedang' },
    { kunci: ['hujan ringan', 'hujan lokal'], tingkat: 'rendah' },
];

function nilaiRisiko(deskripsi) {
    const d = String(deskripsi || '').toLowerCase();
    for (const r of RISIKO) {
        if (r.kunci.some((k) => d.includes(k))) return r.tingkat;
    }
    return 'aman';
}

const BOBOT = { aman: 0, rendah: 1, sedang: 2, tinggi: 3 };

/**
 * Bentuk respons BMKG bisa berubah sewaktu-waktu, jadi pembacaannya
 * dibuat toleran: apa pun yang tidak dikenali dilewati, bukan bikin error.
 */
function normalisasi(json) {
    const daftar = Array.isArray(json?.data) ? json.data : [];
    const lokasi = json?.lokasi ?? daftar[0]?.lokasi ?? null;

    // Kalau kodenya tingkat kabupaten, BMKG mengembalikan banyak kelurahan.
    // Semuanya dibaca supaya bisa diambil kondisi terburuk di wilayah itu.
    const items = [];

    for (const entri of daftar) {
        const cuacaMentah = entri?.cuaca ?? [];
        for (const kelompok of Array.isArray(cuacaMentah) ? cuacaMentah : []) {
            for (const c of Array.isArray(kelompok) ? kelompok : []) {
                if (!c) continue;
                items.push({
                    waktu: c.local_datetime ?? c.datetime ?? null,
                    suhu: c.t ?? null,
                    kelembapan: c.hu ?? null,
                    deskripsi: c.weather_desc ?? c.weather_desc_en ?? '-',
                    ikon: c.image ?? null,
                    kecepatanAngin: c.ws ?? null,
                    risiko: nilaiRisiko(c.weather_desc),
                });
            }
        }
    }

    return { lokasi, items, jumlahWilayah: daftar.length };
}

/** Ringkas prakiraan per hari, ambil kondisi terburuk di hari itu */
function ringkasPerHari(items) {
    const perHari = new Map();

    for (const it of items) {
        if (!it.waktu) continue;
        const tanggal = String(it.waktu).slice(0, 10);

        const ada = perHari.get(tanggal);
        if (!ada || BOBOT[it.risiko] > BOBOT[ada.risiko]) {
            perHari.set(tanggal, {
                tanggal,
                deskripsi: it.deskripsi,
                risiko: it.risiko,
                suhu: it.suhu,
                kelembapan: it.kelembapan,
                ikon: it.ikon,
            });
        }
    }

    return Array.from(perHari.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
}

/** Susun peringatan yang relevan untuk pengadaan bahan baku */
function susunPeringatan(harian, kota) {
    const berisiko = harian.filter((h) => h.risiko === 'tinggi' || h.risiko === 'sedang');

    if (berisiko.length === 0) {
        return {
            ada: false,
            tingkat: 'aman',
            pesan: `Cuaca di ${kota || 'wilayah Anda'} beberapa hari ke depan relatif kondusif untuk panen dan pengiriman.`,
        };
    }

    const tinggi = berisiko.filter((h) => h.risiko === 'tinggi');
    const tingkat = tinggi.length > 0 ? 'tinggi' : 'sedang';

    const pesan =
        tingkat === 'tinggi'
            ? `${tinggi.length} hari dengan hujan lebat diperkirakan di ${kota || 'wilayah Anda'}. Panen dan pengiriman dari kelompok tani berpotensi tertunda — pertimbangkan memesan lebih awal atau menambah cadangan stok.`
            : `Hujan diperkirakan turun di ${kota || 'wilayah Anda'} dalam beberapa hari ke depan. Jadwal pengiriman bisa sedikit bergeser.`;

    return { ada: true, tingkat, pesan, hariBerisiko: berisiko.length };
}

/**
 * Ambil prakiraan cuaca untuk satu kota.
 * @returns {Promise<object>} objek berisi harian[] dan peringatan
 */
async function prakiraanUntukKota(kota) {
    const kode = kodeUntukKota(kota);

    if (!kode) {
        return {
            tersedia: false,
            alasan:
                'Kode wilayah BMKG belum diatur. Isi BMKG_ADM4_DEFAULT di .env backend dengan kode kelurahan wilayah operasional.',
            kota,
        };
    }

    const cached = cache.get(kode);
    if (cached && Date.now() - cached.waktu < CACHE_TTL_MS) {
        return cached.data;
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const param = paramUntukKode(kode);
        const url = `${BMKG_BASE}?${param}=${encodeURIComponent(kode)}`;

        // Cloudflare di depan BMKG menolak permintaan tanpa User-Agent yang wajar,
        // jadi identitasnya disamakan dengan peramban biasa.
        const res = await fetch(url, {
            signal: controller.signal,
            redirect: 'follow',
            headers: {
                Accept: 'application/json, text/plain, */*',
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
                'Accept-Language': 'id-ID,id;q=0.9',
            },
        });
        clearTimeout(timeout);

        if (!res.ok) {
            throw new Error(`BMKG membalas status ${res.status} untuk ${url}`);
        }

        const tipe = res.headers.get('content-type') || '';
        if (!tipe.includes('json')) {
            throw new Error(`BMKG membalas ${tipe || 'tipe tak dikenal'}, bukan JSON`);
        }

        const json = await res.json();
        const { lokasi, items, jumlahWilayah } = normalisasi(json);
        const harian = ringkasPerHari(items);

        const namaKota = lokasi?.kotkab || lokasi?.desa || kota;

        const data = {
            tersedia: true,
            kota: namaKota,
            kecamatan: lokasi?.kecamatan ?? null,
            diperbaruiPada: new Date().toISOString(),
            harian: harian.slice(0, 3),
            peringatan: susunPeringatan(harian, namaKota),
            cakupanWilayah: jumlahWilayah,
            sumber: 'BMKG (data terbuka)',
        };

        cache.set(kode, { waktu: Date.now(), data });
        return data;
    } catch (err) {
        // Cuaca hanya pelengkap. Kalau BMKG sedang tidak bisa dihubungi,
        // aplikasi tetap jalan dan cuma menyembunyikan kartunya.
        console.warn('Gagal mengambil data BMKG:', err.message);
        return {
            tersedia: false,
            alasan: 'Layanan BMKG sedang tidak dapat dihubungi.',
            kota,
        };
    }
}

module.exports = {
    prakiraanUntukKota,
    paramUntukKode,
    kodeUntukKota,
    nilaiRisiko,
    ringkasPerHari,
    normalisasi,
    KODE_WILAYAH,
};