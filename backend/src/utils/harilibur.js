/**
 * Kalender hari libur nasional Indonesia.
 *
 * Dipakai sebagai faktor tambahan dalam peramalan kebutuhan bahan
 * baku, sesuai Bab II proposal yang menyebut "histori penjualan,
 * musim, hari libur, dan tren permintaan".
 *
 * CATATAN PENTING: tanggal hari raya Islam mengikuti kalender
 * hijriah dan bergeser setiap tahun. Tanggal di bawah untuk tahun
 * mendatang bersifat perkiraan dan perlu diperbarui setelah
 * pemerintah menerbitkan SKB hari libur resmi.
 */

/** Tanggal tetap setiap tahun, format MM-DD */
const LIBUR_TETAP = [
    { tanggal: '01-01', nama: 'Tahun Baru Masehi' },
    { tanggal: '05-01', nama: 'Hari Buruh' },
    { tanggal: '06-01', nama: 'Hari Lahir Pancasila' },
    { tanggal: '08-17', nama: 'Hari Kemerdekaan' },
    { tanggal: '12-25', nama: 'Hari Raya Natal' },
];

/**
 * Hari libur yang tanggalnya berpindah tiap tahun.
 * Idulfitri diberi bobot lebih besar karena dampaknya pada
 * usaha kuliner jauh melebihi hari libur biasa.
 */
const LIBUR_BERGERAK = {
    2024: [
        { tanggal: '2024-02-08', nama: 'Isra Mikraj' },
        { tanggal: '2024-02-10', nama: 'Tahun Baru Imlek' },
        { tanggal: '2024-03-11', nama: 'Hari Raya Nyepi' },
        { tanggal: '2024-03-29', nama: 'Wafat Isa Almasih' },
        { tanggal: '2024-04-10', nama: 'Idulfitri', bobot: 3 },
        { tanggal: '2024-04-11', nama: 'Idulfitri', bobot: 3 },
        { tanggal: '2024-05-09', nama: 'Kenaikan Isa Almasih' },
        { tanggal: '2024-05-23', nama: 'Hari Raya Waisak' },
        { tanggal: '2024-06-17', nama: 'Iduladha', bobot: 2 },
        { tanggal: '2024-07-07', nama: 'Tahun Baru Islam' },
        { tanggal: '2024-09-16', nama: 'Maulid Nabi' },
    ],
    2025: [
        { tanggal: '2025-01-27', nama: 'Isra Mikraj' },
        { tanggal: '2025-01-29', nama: 'Tahun Baru Imlek' },
        { tanggal: '2025-03-29', nama: 'Hari Raya Nyepi' },
        { tanggal: '2025-03-31', nama: 'Idulfitri', bobot: 3 },
        { tanggal: '2025-04-01', nama: 'Idulfitri', bobot: 3 },
        { tanggal: '2025-04-18', nama: 'Wafat Isa Almasih' },
        { tanggal: '2025-05-01', nama: 'Hari Buruh' },
        { tanggal: '2025-05-12', nama: 'Hari Raya Waisak' },
        { tanggal: '2025-05-29', nama: 'Kenaikan Isa Almasih' },
        { tanggal: '2025-06-06', nama: 'Iduladha', bobot: 2 },
        { tanggal: '2025-06-27', nama: 'Tahun Baru Islam' },
        { tanggal: '2025-09-05', nama: 'Maulid Nabi' },
    ],
    2026: [
        { tanggal: '2026-01-16', nama: 'Isra Mikraj' },
        { tanggal: '2026-02-17', nama: 'Tahun Baru Imlek' },
        { tanggal: '2026-03-19', nama: 'Hari Raya Nyepi' },
        { tanggal: '2026-03-20', nama: 'Idulfitri', bobot: 3 },
        { tanggal: '2026-03-21', nama: 'Idulfitri', bobot: 3 },
        { tanggal: '2026-04-03', nama: 'Wafat Isa Almasih' },
        { tanggal: '2026-05-14', nama: 'Kenaikan Isa Almasih' },
        { tanggal: '2026-05-27', nama: 'Iduladha', bobot: 2 },
        { tanggal: '2026-05-31', nama: 'Hari Raya Waisak' },
        { tanggal: '2026-06-16', nama: 'Tahun Baru Islam' },
        { tanggal: '2026-08-25', nama: 'Maulid Nabi' },
    ],
    2027: [
        { tanggal: '2027-01-06', nama: 'Isra Mikraj' },
        { tanggal: '2027-02-06', nama: 'Tahun Baru Imlek' },
        { tanggal: '2027-03-09', nama: 'Idulfitri', bobot: 3 },
        { tanggal: '2027-03-10', nama: 'Idulfitri', bobot: 3 },
        { tanggal: '2027-03-26', nama: 'Wafat Isa Almasih' },
        { tanggal: '2027-04-08', nama: 'Hari Raya Nyepi' },
        { tanggal: '2027-05-06', nama: 'Kenaikan Isa Almasih' },
        { tanggal: '2027-05-16', nama: 'Iduladha', bobot: 2 },
        { tanggal: '2027-05-20', nama: 'Hari Raya Waisak' },
        { tanggal: '2027-06-06', nama: 'Tahun Baru Islam' },
        { tanggal: '2027-08-14', nama: 'Maulid Nabi' },
    ],
};

const cache = new Map();

/**
 * Bobot hari libur pada satu bulan.
 * Hari libur biasa bernilai 1, Iduladha 2, Idulfitri 3 — karena
 * dampaknya terhadap permintaan pangan memang berbeda jauh.
 *
 * @param {string} periode format "2026-03"
 */
function bobotLiburBulan(periode) {
    if (cache.has(periode)) return cache.get(periode);

    const [tahun, bulan] = periode.split('-');
    const mm = String(bulan).padStart(2, '0');

    let bobot = 0;
    const daftar = [];

    for (const l of LIBUR_TETAP) {
        if (l.tanggal.startsWith(`${mm}-`)) {
            bobot += 1;
            daftar.push(l.nama);
        }
    }

    for (const l of LIBUR_BERGERAK[tahun] ?? []) {
        if (l.tanggal.startsWith(`${tahun}-${mm}`)) {
            bobot += l.bobot ?? 1;
            daftar.push(l.nama);
        }
    }

    const hasil = { bobot, daftar: [...new Set(daftar)] };
    cache.set(periode, hasil);
    return hasil;
}

/** Apakah tahun tersebut punya data hari libur bergerak */
function tahunTersedia(periode) {
    const tahun = periode.split('-')[0];
    return Boolean(LIBUR_BERGERAK[tahun]);
}

module.exports = { bobotLiburBulan, tahunTersedia, LIBUR_TETAP, LIBUR_BERGERAK };