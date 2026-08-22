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
 */

/** Titik pusat kabupaten/kota di Aceh dan sekitarnya */
const KOORDINAT = {
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
    return { hari: 4, label: '3-4 hari', catatan: 'Jarak jauh' };
}

/**
 * Hitung jarak dan estimasi pengiriman antara dua kota.
 * @returns {null|{km: number, estimasi: object, samaKota: boolean}}
 */
function hitungPengiriman(kotaAsal, kotaTujuan) {
    if (!kotaAsal || !kotaTujuan) return null;

    const a = cariKoordinat(kotaAsal);
    const b = cariKoordinat(kotaTujuan);
    if (!a || !b) return null;

    const samaKota =
        String(kotaAsal).toLowerCase().trim() === String(kotaTujuan).toLowerCase().trim();

    const lurus = haversine(a, b);
    const km = samaKota ? 0 : Math.round(lurus * FAKTOR_JALAN);

    return {
        km,
        samaKota,
        estimasi: samaKota
            ? { hari: 0, label: 'Hari yang sama', catatan: 'Satu kota' }
            : estimasiKirim(km),
    };
}

module.exports = { hitungPengiriman, cariKoordinat, haversine, KOORDINAT };