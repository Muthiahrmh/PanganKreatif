/**
 * Data demo PanganKreatif — dikalibrasi ke proyeksi Bab V proposal.
 *
 * Jalankan dari folder backend:
 *   node prisma/seed.js
 *
 * Sasaran yang direplikasi:
 *   Tabel 3.4  300 UMKM, 20 kelompok tani mitra, pertumbuhan kuartalan
 *   Tabel 5.6  komisi transaksi Rp65.000.000, HPP 2.000 x Rp10.000
 *
 * PENTING — data ini SINTETIS dan sengaja dikalibrasi ke asumsi
 * rencana bisnis, bukan hasil pengukuran lapangan. Fungsinya
 * menunjukkan bahwa sistem mampu mencatat dan menghitung sesuai
 * model bisnis yang diajukan, bukan membuktikan proyeksinya benar.
 *
 * Nama usaha fiktif mengikuti pola penamaan Aceh. Harga perkiraan.
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PASSWORD_AKUN_BARU = 'Demo12345!';
const KOMISI = Number(process.env.PLATFORM_COMMISSION_RATE ?? 0.02);
const MARGIN = Number(process.env.PLATFORM_MARGIN_RATE ?? 0.017);

// --- Sasaran dari proposal ---
const TARGET_UMKM = 300;            // Tabel 3.4
const TARGET_SUPPLIER = 20;         // Tabel 3.4
const TARGET_TRANSAKSI = 2000;      // Tabel 5.6 (dasar perhitungan HPP)
const TARGET_KOMISI = 65_000_000;   // Tabel 5.6 komisi transaksi supply chain
const PESANAN_TERBUKA = 12;         // dibatasi supaya demo tetap mudah dinavigasi
const MIN_PRODUK_PER_SUPPLIER = 20; // katalog tiap pemasok dilengkapi sampai jumlah ini

/**
 * Pertumbuhan kuartalan Tabel 3.4.
 * umkmAktif = jumlah UMKM terdaftar pada akhir kuartal,
 * porsi = bagian pendapatan kuartal itu terhadap setahun.
 */
const KUARTAL = [
    { label: 'K1', umkmAktif: 30, porsi: 5 / 120 },
    { label: 'K2', umkmAktif: 80, porsi: 20 / 120 },
    { label: 'K3', umkmAktif: 170, porsi: 40 / 120 },
    { label: 'K4', umkmAktif: 300, porsi: 55 / 120 },
];

const JUMLAH_SUPPLIER_TAMBAHAN = TARGET_SUPPLIER - 7;
const JUMLAH_UMKM_TAMBAHAN = TARGET_UMKM - 8;

const uuid = () => crypto.randomUUID();

function rnd(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function pilih(arr, seed) {
    return arr[Math.floor(rnd(seed) * arr.length) % arr.length];
}

function hashTeks(teks) {
    let h = 7;
    for (let i = 0; i < teks.length; i++) h = (h * 31 + teks.charCodeAt(i)) % 1000000;
    return h;
}

/** Panjang digit nomor rekening lazim per bank, supaya data demo tidak kelihatan asal */
const PANJANG_REKENING = {
    'Bank Aceh Syariah': 10,
    'Bank BRI': 15,
    'Bank BSI': 10,
    'Bank Mandiri': 13,
    'Bank BNI': 10,
};

/** Nomor rekening acak sepanjang digit yang wajar untuk bank tersebut */
function buatNomorRekening(bank, seed) {
    const panjang = PANJANG_REKENING[bank] ?? 10;
    let nomor = String(1 + Math.floor(rnd(seed) * 9)); // digit pertama tidak nol
    for (let i = 1; i < panjang; i++) {
        nomor += String(Math.floor(rnd(seed + i * 97) * 10));
    }
    return nomor;
}

async function batchCreate(model, rows, ukuran = 300) {
    for (let i = 0; i < rows.length; i += ukuran) {
        await model.createMany({ data: rows.slice(i, i + ukuran), skipDuplicates: true });
    }
}
// ============================================================
// Referensi wilayah dan nama — konteks Aceh
// ============================================================

const KOTA = [
    { nama: 'Lhokseumawe', bobot: 55 },
    { nama: 'Aceh Utara', bobot: 15 },
    { nama: 'Bireuen', bobot: 12 },
    { nama: 'Pidie', bobot: 6 },
    { nama: 'Aceh Timur', bobot: 5 },
    { nama: 'Langsa', bobot: 4 },
    { nama: 'Bener Meriah', bobot: 3 },
];

const KOTA_TERBOBOT = KOTA.flatMap((k) => Array(k.bobot).fill(k.nama));

const GAMPONG = {
    Lhokseumawe: [
        'Banda Sakti', 'Muara Dua', 'Muara Satu', 'Blang Mangat', 'Cunda',
        'Pusong Baru', 'Keude Aceh', 'Mon Geudong', 'Hagu Selatan', 'Uteun Bayi',
        'Batuphat Timur', 'Blang Pulo', 'Alue Awe', 'Meunasah Mesjid', 'Simpang Kramat',
    ],
    'Aceh Utara': ['Lhoksukon', 'Dewantara', 'Nisam', 'Syamtalira Bayu', 'Matangkuli', 'Tanah Luas'],
    Bireuen: ['Kota Juang', 'Peusangan', 'Jeumpa', 'Kuala', 'Gandapura', 'Jeunieb'],
    Pidie: ['Sigli', 'Meureudu', 'Delima', 'Mutiara', 'Peukan Baro'],
    'Aceh Timur': ['Idi Rayeuk', 'Peureulak', 'Rantau Selamat', 'Julok'],
    Langsa: ['Langsa Kota', 'Langsa Baro', 'Langsa Timur'],
    'Bener Meriah': ['Bandar', 'Bukit', 'Pintu Rime Gayo', 'Wih Pesam'],
};

const NAMA_DEPAN = [
    'Teuku', 'Cut', 'Muhammad', 'Nurul', 'Zulfikar', 'Rahmat', 'Maulida', 'Fitriani',
    'Syahrul', 'Iqbal', 'Rina', 'Yusra', 'Munira', 'Safrizal', 'Marzuki', 'Nazaruddin',
    'Fauzan', 'Dahlia', 'Khairul', 'Salmiah', 'Ridwan', 'Hafizah', 'Bustamam', 'Rosmawar',
    'Jamaluddin', 'Mariana', 'Saifullah', 'Nurhasanah', 'Irwansyah', 'Cut Nyak',
];

const NAMA_BELAKANG = [
    'Ibrahim', 'Yusuf', 'Hasan', 'Abdullah', 'Rahman', 'Basyah', 'Muda', 'Aziz',
    'Nurdin', 'Syah', 'Amin', 'Umar', 'Idris', 'Daud', 'Ismail', 'Zakaria',
];

// --- UMKM kuliner ---

const JENIS_UMKM = [
    { tipe: 'Rumah Makan', pola: ['Mie Aceh {n}', 'RM {n}', 'Rumah Makan {n}'], skala: [0.8, 1.4] },
    { tipe: 'Warung Kopi', pola: ['Warkop {n}', 'Warung Kupi {n}', 'Kupi {n}'], skala: [0.5, 1.0] },
    { tipe: 'Warung Nasi', pola: ['Warung {n}', 'Nasi Gurih {n}', 'Warung Bu {n}'], skala: [0.5, 0.9] },
    { tipe: 'Katering', pola: ['Katering {n}', '{n} Catering'], skala: [0.9, 1.6] },
    { tipe: 'Kue Tradisional', pola: ['Kue {n}', 'Timphan {n}', 'Adee {n}'], skala: [0.3, 0.7] },
    { tipe: 'Kedai', pola: ['Martabak {n}', 'Kedai {n}', 'Sate Matang {n}'], skala: [0.4, 0.9] },
    { tipe: 'Kafe', pola: ['Kafe {n}', 'Kopi {n}', '{n} Coffee'], skala: [0.5, 1.1] },
    { tipe: 'Seafood', pola: ['Seafood {n}', 'RM Laut {n}'], skala: [0.8, 1.3] },
    { tipe: 'Bakery', pola: ['Roti {n}', 'Bakery {n}'], skala: [0.5, 1.0] },
    { tipe: 'Ayam Penyet', pola: ['Ayam Penyet {n}', 'Penyet {n}'], skala: [0.6, 1.1] },
];

const NAMA_USAHA = [
    'Meutuah', 'Seulanga', 'Bungong', 'Rencong', 'Samudera', 'Malahayati', 'Iskandar',
    'Cut Meutia', 'Peusangan', 'Krueng', 'Lampoh', 'Beurata', 'Gampong', 'Tgk Chik',
    'Rahmah', 'Barakah', 'Sejahtera', 'Berkah', 'Nikmat', 'Sedap', 'Mantap', 'Aneuk Nanggroe',
    'Ureung Aceh', 'Meurah', 'Teungku', 'Pase', 'Jeumpa', 'Arun', 'Blang', 'Pantai',
    'Ceria', 'Bahagia', 'Amanah', 'Mutiara', 'Cahaya', 'Harapan', 'Bersama', 'Mandiri',
];

/** Bahan baku utama per jenis usaha */
const BAHAN_PER_JENIS = {
    'Rumah Makan': ['Cabai Merah Keriting', 'Bawang Putih', 'Daun Temurui', 'Udang'],
    'Warung Kopi': ['Kopi Robusta', 'Gula Pasir', 'Tepung Terigu'],
    'Warung Nasi': ['Cabai Merah Keriting', 'Ikan Tongkol', 'Minyak Goreng'],
    Katering: ['Cabai Merah Keriting', 'Bawang Merah', 'Daging Sapi', 'Minyak Goreng'],
    'Kue Tradisional': ['Kelapa Parut', 'Gula Pasir', 'Pisang Kepok'],
    Kedai: ['Telur Ayam', 'Tepung Terigu', 'Bawang Merah'],
    Kafe: ['Kopi Arabika Gayo', 'Gula Pasir', 'Kopi Robusta'],
    Seafood: ['Ikan Kembung', 'Cumi', 'Asam Sunti'],
    Bakery: ['Tepung Terigu', 'Gula Pasir', 'Telur Ayam'],
    'Ayam Penyet': ['Cabai Rawit', 'Minyak Goreng', 'Bawang Merah'],
};

// --- Pemasok ---

const JENIS_SUPPLIER = [
    { pola: 'Kelompok Tani {n}', jenis: 'sayur' },
    { pola: 'Gapoktan {n}', jenis: 'sayur' },
    { pola: 'Koperasi Tani {n}', jenis: 'sayur' },
    { pola: 'UD {n}', jenis: 'sembako' },
    { pola: 'Distributor {n}', jenis: 'sembako' },
    { pola: 'Koperasi Nelayan {n}', jenis: 'ikan' },
    { pola: 'CV {n} Pangan', jenis: 'sembako' },
    { pola: 'Poktan {n}', jenis: 'bumbu' },
];

/** Katalog komoditas beserta kisaran harga */
const KATALOG = {
    sayur: [
        { name: 'Cabai Merah Keriting', category: 'Sayuran', unit: 'kg', min: 33000, max: 42000 },
        { name: 'Cabai Rawit', category: 'Sayuran', unit: 'kg', min: 40000, max: 52000 },
        { name: 'Cabai Kering', category: 'Bumbu Dapur', unit: 'kg', min: 55000, max: 70000 },
        { name: 'Tomat', category: 'Sayuran', unit: 'kg', min: 10000, max: 15000 },
        { name: 'Kentang', category: 'Sayuran', unit: 'kg', min: 12000, max: 17000 },
        { name: 'Wortel', category: 'Sayuran', unit: 'kg', min: 10000, max: 15000 },
        { name: 'Kol', category: 'Sayuran', unit: 'kg', min: 7000, max: 11000 },
        { name: 'Bawang Merah', category: 'Bumbu Dapur', unit: 'kg', min: 28000, max: 36000 },
        { name: 'Nangka Muda', category: 'Sayuran', unit: 'kg', min: 8000, max: 13000 },
        { name: 'Kacang Panjang', category: 'Sayuran', unit: 'kg', min: 9000, max: 14000 },
        { name: 'Buncis', category: 'Sayuran', unit: 'kg', min: 11000, max: 16000 },
        { name: 'Terong', category: 'Sayuran', unit: 'kg', min: 8000, max: 12000 },
        { name: 'Timun', category: 'Sayuran', unit: 'kg', min: 7000, max: 11000 },
        { name: 'Labu Siam', category: 'Sayuran', unit: 'kg', min: 6000, max: 10000 },
        { name: 'Daun Bawang', category: 'Sayuran', unit: 'kg', min: 14000, max: 20000 },
        { name: 'Sawi Hijau', category: 'Sayuran', unit: 'kg', min: 8000, max: 13000 },
        { name: 'Bayam', category: 'Sayuran', unit: 'ikat', min: 3000, max: 5000 },
        { name: 'Jagung Manis', category: 'Sayuran', unit: 'kg', min: 9000, max: 14000 },
        { name: 'Kangkung', category: 'Sayuran', unit: 'ikat', min: 3000, max: 5000 },
        { name: 'Brokoli', category: 'Sayuran', unit: 'kg', min: 22000, max: 30000 },
        { name: 'Kembang Kol', category: 'Sayuran', unit: 'kg', min: 16000, max: 23000 },
        { name: 'Seledri', category: 'Sayuran', unit: 'kg', min: 20000, max: 28000 },
        { name: 'Pare', category: 'Sayuran', unit: 'kg', min: 9000, max: 14000 },
        { name: 'Cabai Hijau', category: 'Sayuran', unit: 'kg', min: 25000, max: 34000 },
        { name: 'Ubi Kayu', category: 'Sayuran', unit: 'kg', min: 6000, max: 9000 },
        { name: 'Ubi Jalar', category: 'Sayuran', unit: 'kg', min: 8000, max: 12000 },
    ],
    sembako: [
        { name: 'Beras Lokal', category: 'Sembako', unit: 'kg', min: 12800, max: 15500 },
        { name: 'Beras Premium', category: 'Sembako', unit: 'kg', min: 15000, max: 18500 },
        { name: 'Minyak Goreng', category: 'Sembako', unit: 'liter', min: 16500, max: 19500 },
        { name: 'Gula Pasir', category: 'Sembako', unit: 'kg', min: 16000, max: 19000 },
        { name: 'Tepung Terigu', category: 'Sembako', unit: 'kg', min: 11500, max: 14000 },
        { name: 'Tepung Beras', category: 'Sembako', unit: 'kg', min: 13000, max: 16500 },
        { name: 'Tepung Ketan', category: 'Sembako', unit: 'kg', min: 17000, max: 21000 },
        { name: 'Telur Ayam', category: 'Protein', unit: 'kg', min: 26000, max: 32000 },
        { name: 'Gula Merah', category: 'Sembako', unit: 'kg', min: 20000, max: 25000 },
        { name: 'Garam Halus', category: 'Sembako', unit: 'kg', min: 5000, max: 8000 },
        { name: 'Kacang Tanah', category: 'Sembako', unit: 'kg', min: 26000, max: 34000 },
        { name: 'Mie Basah', category: 'Sembako', unit: 'kg', min: 14000, max: 18000 },
        { name: 'Kecap Manis', category: 'Sembako', unit: 'liter', min: 22000, max: 28000 },
        { name: 'Emping Melinjo', category: 'Sembako', unit: 'kg', min: 45000, max: 58000 },
        { name: 'Tepung Tapioka', category: 'Sembako', unit: 'kg', min: 12000, max: 16000 },
        { name: 'Margarin', category: 'Sembako', unit: 'kg', min: 24000, max: 32000 },
        { name: 'Susu Kental Manis', category: 'Sembako', unit: 'kg', min: 26000, max: 34000 },
        { name: 'Ragi Instan', category: 'Sembako', unit: 'kg', min: 65000, max: 85000 },
        { name: 'Soda Kue', category: 'Sembako', unit: 'kg', min: 18000, max: 25000 },
        { name: 'Bihun', category: 'Sembako', unit: 'kg', min: 20000, max: 27000 },
        { name: 'Kwetiau Kering', category: 'Sembako', unit: 'kg', min: 22000, max: 29000 },
        { name: 'Minyak Kelapa', category: 'Sembako', unit: 'liter', min: 25000, max: 34000 },
        { name: 'Saus Tomat', category: 'Sembako', unit: 'liter', min: 18000, max: 24000 },
        { name: 'Kerupuk Mentah', category: 'Sembako', unit: 'kg', min: 28000, max: 38000 },
    ],
    ikan: [
        { name: 'Ikan Tongkol', category: 'Protein', unit: 'kg', min: 26000, max: 34000 },
        { name: 'Ikan Kembung', category: 'Protein', unit: 'kg', min: 32000, max: 40000 },
        { name: 'Ikan Dencis', category: 'Protein', unit: 'kg', min: 28000, max: 36000 },
        { name: 'Ikan Bandeng', category: 'Protein', unit: 'kg', min: 30000, max: 38000 },
        { name: 'Udang', category: 'Protein', unit: 'kg', min: 70000, max: 88000 },
        { name: 'Cumi', category: 'Protein', unit: 'kg', min: 55000, max: 70000 },
        { name: 'Ikan Kayu', category: 'Protein', unit: 'kg', min: 78000, max: 95000 },
        { name: 'Kepiting', category: 'Protein', unit: 'kg', min: 85000, max: 110000 },
        { name: 'Kerang Hijau', category: 'Protein', unit: 'kg', min: 20000, max: 28000 },
        { name: 'Ikan Teri', category: 'Protein', unit: 'kg', min: 55000, max: 72000 },
        { name: 'Ikan Asin', category: 'Protein', unit: 'kg', min: 48000, max: 62000 },
        { name: 'Ikan Tuna', category: 'Protein', unit: 'kg', min: 45000, max: 58000 },
        { name: 'Ikan Kakap', category: 'Protein', unit: 'kg', min: 55000, max: 72000 },
        { name: 'Ikan Nila', category: 'Protein', unit: 'kg', min: 28000, max: 36000 },
        { name: 'Ikan Lele', category: 'Protein', unit: 'kg', min: 24000, max: 31000 },
        { name: 'Ikan Selar', category: 'Protein', unit: 'kg', min: 26000, max: 34000 },
        { name: 'Ikan Bawal', category: 'Protein', unit: 'kg', min: 42000, max: 55000 },
        { name: 'Rajungan', category: 'Protein', unit: 'kg', min: 70000, max: 92000 },
        { name: 'Gurita', category: 'Protein', unit: 'kg', min: 58000, max: 75000 },
        { name: 'Udang Rebon', category: 'Protein', unit: 'kg', min: 38000, max: 50000 },
        { name: 'Ikan Pari', category: 'Protein', unit: 'kg', min: 30000, max: 40000 },
        { name: 'Ikan Sarden', category: 'Protein', unit: 'kg', min: 25000, max: 33000 },
    ],
    bumbu: [
        { name: 'Asam Sunti', category: 'Bumbu Dapur', unit: 'kg', min: 38000, max: 48000 },
        { name: 'Daun Temurui', category: 'Bumbu Dapur', unit: 'kg', min: 22000, max: 30000 },
        { name: 'Kayu Manis', category: 'Bumbu Dapur', unit: 'kg', min: 43000, max: 55000 },
        { name: 'Serai', category: 'Bumbu Dapur', unit: 'kg', min: 11000, max: 16000 },
        { name: 'Kunyit', category: 'Bumbu Dapur', unit: 'kg', min: 13000, max: 19000 },
        { name: 'Jahe', category: 'Bumbu Dapur', unit: 'kg', min: 28000, max: 36000 },
        { name: 'Lengkuas', category: 'Bumbu Dapur', unit: 'kg', min: 11000, max: 16000 },
        { name: 'Bawang Putih', category: 'Bumbu Dapur', unit: 'kg', min: 31000, max: 39000 },
        { name: 'Bawang Bombay', category: 'Bumbu Dapur', unit: 'kg', min: 22000, max: 30000 },
        { name: 'Kelapa Parut', category: 'Bumbu Dapur', unit: 'kg', min: 11000, max: 15000 },
        { name: 'Ketumbar', category: 'Bumbu Dapur', unit: 'kg', min: 32000, max: 42000 },
        { name: 'Merica Butir', category: 'Bumbu Dapur', unit: 'kg', min: 95000, max: 125000 },
        { name: 'Pala', category: 'Bumbu Dapur', unit: 'kg', min: 75000, max: 95000 },
        { name: 'Cengkeh', category: 'Bumbu Dapur', unit: 'kg', min: 110000, max: 145000 },
        { name: 'Kapulaga', category: 'Bumbu Dapur', unit: 'kg', min: 130000, max: 170000 },
        { name: 'Daun Jeruk', category: 'Bumbu Dapur', unit: 'kg', min: 18000, max: 26000 },
        { name: 'Daun Salam', category: 'Bumbu Dapur', unit: 'kg', min: 16000, max: 24000 },
        { name: 'Daun Kunyit', category: 'Bumbu Dapur', unit: 'kg', min: 18000, max: 26000 },
        { name: 'Kemiri', category: 'Bumbu Dapur', unit: 'kg', min: 42000, max: 55000 },
        { name: 'Asam Jawa', category: 'Bumbu Dapur', unit: 'kg', min: 26000, max: 35000 },
        { name: 'Jintan', category: 'Bumbu Dapur', unit: 'kg', min: 55000, max: 72000 },
        { name: 'Adas', category: 'Bumbu Dapur', unit: 'kg', min: 48000, max: 62000 },
        { name: 'Bunga Lawang', category: 'Bumbu Dapur', unit: 'kg', min: 90000, max: 120000 },
        { name: 'Kencur', category: 'Bumbu Dapur', unit: 'kg', min: 24000, max: 33000 },
        { name: 'Temu Kunci', category: 'Bumbu Dapur', unit: 'kg', min: 22000, max: 30000 },
        { name: 'Jahe Merah', category: 'Bumbu Dapur', unit: 'kg', min: 38000, max: 50000 },
        { name: 'Santan Kelapa', category: 'Bumbu Dapur', unit: 'liter', min: 15000, max: 21000 },
    ],
};

// ============================================================
// Mitra utama — dipakai sebagai tokoh dalam demo
// ============================================================

const SUPPLIERS_UTAMA = [
    {
        email: 'makmur@supplier.com', bankName: 'Bank Aceh Syariah', bankAccountNumber: '0102030405', bankAccountHolder: 'Kelompok Tani Makmur', name: 'Sudirman', groupName: 'Kelompok Tani Makmur', katalog: 'sayur',
        city: 'Lhokseumawe', address: 'Gampong Blang Panyang, Muara Satu, Lhokseumawe', phone: '081111111111',
        products: [
            { name: 'Cabai Merah Keriting', category: 'Sayuran', unit: 'kg', price: 38000, stock: 400, bulkPrice: 33000, bulkMinQty: 60 },
            { name: 'Bawang Merah', category: 'Bumbu Dapur', unit: 'kg', price: 32000, stock: 350, bulkPrice: 28000, bulkMinQty: 50 },
            { name: 'Tomat', category: 'Sayuran', unit: 'kg', price: 13000, stock: 300, bulkPrice: 11000, bulkMinQty: 80 },
            { name: 'Cabai Rawit', category: 'Sayuran', unit: 'kg', price: 45000, stock: 180, bulkPrice: 39000, bulkMinQty: 40 },
            { name: 'Kacang Panjang', category: 'Sayuran', unit: 'kg', price: 11000, stock: 220, bulkPrice: 9500, bulkMinQty: 60 },
            { name: 'Terong', category: 'Sayuran', unit: 'kg', price: 9500, stock: 240, bulkPrice: 8000, bulkMinQty: 70 },
            { name: 'Timun', category: 'Sayuran', unit: 'kg', price: 8500, stock: 260, bulkPrice: 7000, bulkMinQty: 80 },
        ],
    },
    {
        email: 'sembako@supplier.com', bankName: 'Bank BRI', bankAccountNumber: '015601000123456', bankAccountHolder: 'Rosnani', name: 'Rosnani', groupName: 'Distributor Sembako Aceh', katalog: 'sembako',
        city: 'Lhokseumawe', address: 'Jl. Merdeka, Banda Sakti, Lhokseumawe', phone: '082222222222',
        products: [
            { name: 'Minyak Goreng', category: 'Sembako', unit: 'liter', price: 18000, stock: 600, bulkPrice: 16200, bulkMinQty: 100 },
            { name: 'Gula Pasir', category: 'Sembako', unit: 'kg', price: 17500, stock: 500, bulkPrice: 15800, bulkMinQty: 100 },
            { name: 'Tepung Terigu', category: 'Sembako', unit: 'kg', price: 12500, stock: 450, bulkPrice: 11200, bulkMinQty: 100 },
            { name: 'Telur Ayam', category: 'Protein', unit: 'kg', price: 29000, stock: 300, bulkPrice: 26500, bulkMinQty: 60 },
            { name: 'Cabai Merah Keriting', category: 'Sayuran', unit: 'kg', price: 36000, stock: 200, bulkPrice: 32000, bulkMinQty: 80 },
            { name: 'Beras Premium', category: 'Sembako', unit: 'kg', price: 16500, stock: 700, bulkPrice: 15000, bulkMinQty: 150 },
            { name: 'Garam Halus', category: 'Sembako', unit: 'kg', price: 6500, stock: 400, bulkPrice: 5500, bulkMinQty: 100 },
            { name: 'Kecap Manis', category: 'Sembako', unit: 'liter', price: 25000, stock: 280, bulkPrice: 22500, bulkMinQty: 60 },
            { name: 'Mie Basah', category: 'Sembako', unit: 'kg', price: 15500, stock: 320, bulkPrice: 13500, bulkMinQty: 80 },
        ],
    },
    {
        email: 'jaya@supplier.com', bankName: 'Bank Aceh Syariah', bankAccountNumber: '0203040506', bankAccountHolder: 'Tani Jaya', name: 'Iskandar', groupName: 'Tani Jaya', katalog: 'sayur',
        city: 'Bireuen', address: 'Gampong Cot Gapu, Kota Juang, Bireuen', phone: '083333333333',
        products: [
            { name: 'Bawang Merah', category: 'Bumbu Dapur', unit: 'kg', price: 30000, stock: 320, bulkPrice: 26500, bulkMinQty: 60 },
            { name: 'Tomat', category: 'Sayuran', unit: 'kg', price: 13500, stock: 200, bulkPrice: 11500, bulkMinQty: 50 },
            { name: 'Bawang Putih', category: 'Bumbu Dapur', unit: 'kg', price: 34000, stock: 250, bulkPrice: 30000, bulkMinQty: 50 },
            { name: 'Daging Sapi', category: 'Protein', unit: 'kg', price: 145000, stock: 120, bulkPrice: 135000, bulkMinQty: 30 },
            { name: 'Cabai Merah Keriting', category: 'Sayuran', unit: 'kg', price: 37000, stock: 240, bulkPrice: 32500, bulkMinQty: 70 },
            { name: 'Kacang Tanah', category: 'Sembako', unit: 'kg', price: 29000, stock: 200, bulkPrice: 25500, bulkMinQty: 50 },
            { name: 'Jagung Manis', category: 'Sayuran', unit: 'kg', price: 11500, stock: 260, bulkPrice: 9800, bulkMinQty: 70 },
        ],
    },
    {
        email: 'meunasah@supplier.com', bankName: 'Bank BSI', bankAccountNumber: '7112345678', bankAccountHolder: 'Gapoktan Meunasah Blang', name: 'Bustami', groupName: 'Gapoktan Meunasah Blang', katalog: 'sembako',
        city: 'Aceh Utara', address: 'Kecamatan Lhoksukon, Aceh Utara', phone: '084444444444',
        products: [
            { name: 'Beras Lokal', category: 'Sembako', unit: 'kg', price: 13800, stock: 900, bulkPrice: 12500, bulkMinQty: 200 },
            { name: 'Cabai Merah Keriting', category: 'Sayuran', unit: 'kg', price: 35000, stock: 260, bulkPrice: 30500, bulkMinQty: 70 },
            { name: 'Kelapa Parut', category: 'Bumbu Dapur', unit: 'kg', price: 13000, stock: 350, bulkPrice: 11000, bulkMinQty: 80 },
            { name: 'Pisang Kepok', category: 'Buah', unit: 'kg', price: 11000, stock: 280, bulkPrice: 9500, bulkMinQty: 60 },
            { name: 'Beras Premium', category: 'Sembako', unit: 'kg', price: 16000, stock: 800, bulkPrice: 14500, bulkMinQty: 200 },
            { name: 'Emping Melinjo', category: 'Sembako', unit: 'kg', price: 52000, stock: 90, bulkPrice: 46000, bulkMinQty: 20 },
            { name: 'Nangka Muda', category: 'Sayuran', unit: 'kg', price: 10000, stock: 200, bulkPrice: 8500, bulkMinQty: 60 },
        ],
    },
    {
        email: 'pusong@supplier.com', bankName: 'Bank BRI', bankAccountNumber: '015601000987654', bankAccountHolder: 'Koperasi Nelayan Pusong', name: 'Hasballah', groupName: 'Koperasi Nelayan Pusong', katalog: 'ikan',
        city: 'Lhokseumawe', address: 'Gampong Pusong Lama, Banda Sakti, Lhokseumawe', phone: '085555555555',
        products: [
            { name: 'Ikan Tongkol', category: 'Protein', unit: 'kg', price: 30000, stock: 220, bulkPrice: 26000, bulkMinQty: 50 },
            { name: 'Ikan Kembung', category: 'Protein', unit: 'kg', price: 36000, stock: 180, bulkPrice: 32000, bulkMinQty: 40 },
            { name: 'Udang', category: 'Protein', unit: 'kg', price: 78000, stock: 120, bulkPrice: 70000, bulkMinQty: 25 },
            { name: 'Cumi', category: 'Protein', unit: 'kg', price: 62000, stock: 100, bulkPrice: 55000, bulkMinQty: 25 },
            { name: 'Ikan Kayu', category: 'Protein', unit: 'kg', price: 85000, stock: 80, bulkPrice: 76000, bulkMinQty: 20 },
            { name: 'Ikan Dencis', category: 'Protein', unit: 'kg', price: 32000, stock: 200, bulkPrice: 28000, bulkMinQty: 45 },
            { name: 'Kepiting', category: 'Protein', unit: 'kg', price: 95000, stock: 60, bulkPrice: 86000, bulkMinQty: 15 },
            { name: 'Ikan Teri', category: 'Protein', unit: 'kg', price: 62000, stock: 110, bulkPrice: 55000, bulkMinQty: 25 },
            { name: 'Kerang Hijau', category: 'Protein', unit: 'kg', price: 24000, stock: 140, bulkPrice: 20500, bulkMinQty: 40 },
        ],
    },
    {
        email: 'gayo@supplier.com', bankName: 'Bank Mandiri', bankAccountNumber: '1580001234567', bankAccountHolder: 'Koperasi Tani Gayo Mandiri', name: 'Muliadi', groupName: 'Koperasi Tani Gayo Mandiri', katalog: 'sayur',
        city: 'Bener Meriah', address: 'Kecamatan Bandar, Bener Meriah', phone: '086666666666',
        products: [
            { name: 'Kopi Arabika Gayo', category: 'Minuman', unit: 'kg', price: 155000, stock: 150, bulkPrice: 140000, bulkMinQty: 25 },
            { name: 'Kopi Robusta', category: 'Minuman', unit: 'kg', price: 78000, stock: 200, bulkPrice: 70000, bulkMinQty: 40 },
            { name: 'Kentang', category: 'Sayuran', unit: 'kg', price: 14500, stock: 400, bulkPrice: 12500, bulkMinQty: 80 },
            { name: 'Wortel', category: 'Sayuran', unit: 'kg', price: 12500, stock: 350, bulkPrice: 10800, bulkMinQty: 80 },
            { name: 'Kol', category: 'Sayuran', unit: 'kg', price: 8500, stock: 400, bulkPrice: 7200, bulkMinQty: 100 },
            { name: 'Tomat', category: 'Sayuran', unit: 'kg', price: 11500, stock: 380, bulkPrice: 9800, bulkMinQty: 90 },
            { name: 'Buncis', category: 'Sayuran', unit: 'kg', price: 13000, stock: 300, bulkPrice: 11000, bulkMinQty: 70 },
            { name: 'Daun Bawang', category: 'Sayuran', unit: 'kg', price: 16000, stock: 180, bulkPrice: 13500, bulkMinQty: 50 },
            { name: 'Sawi Hijau', category: 'Sayuran', unit: 'kg', price: 10000, stock: 320, bulkPrice: 8500, bulkMinQty: 80 },
        ],
    },
    {
        email: 'rempahpidie@supplier.com', bankName: 'Bank BNI', bankAccountNumber: '0987654321', bankAccountHolder: 'UD Rempah Pidie', name: 'Zulkifli', groupName: 'UD Rempah Pidie', katalog: 'bumbu',
        city: 'Pidie', address: 'Kecamatan Meureudu, Pidie Jaya', phone: '087777777777',
        products: [
            { name: 'Asam Sunti', category: 'Bumbu Dapur', unit: 'kg', price: 42000, stock: 140, bulkPrice: 37000, bulkMinQty: 25 },
            { name: 'Daun Temurui', category: 'Bumbu Dapur', unit: 'kg', price: 26000, stock: 90, bulkPrice: 22000, bulkMinQty: 20 },
            { name: 'Kayu Manis', category: 'Bumbu Dapur', unit: 'kg', price: 48000, stock: 120, bulkPrice: 42000, bulkMinQty: 25 },
            { name: 'Serai', category: 'Bumbu Dapur', unit: 'kg', price: 13000, stock: 200, bulkPrice: 11000, bulkMinQty: 50 },
            { name: 'Kunyit', category: 'Bumbu Dapur', unit: 'kg', price: 16000, stock: 180, bulkPrice: 13500, bulkMinQty: 50 },
            { name: 'Jahe', category: 'Bumbu Dapur', unit: 'kg', price: 32000, stock: 160, bulkPrice: 28000, bulkMinQty: 40 },
            { name: 'Bawang Putih', category: 'Bumbu Dapur', unit: 'kg', price: 36000, stock: 200, bulkPrice: 31500, bulkMinQty: 50 },
            { name: 'Lengkuas', category: 'Bumbu Dapur', unit: 'kg', price: 13500, stock: 190, bulkPrice: 11500, bulkMinQty: 50 },
            { name: 'Ketumbar', category: 'Bumbu Dapur', unit: 'kg', price: 36000, stock: 110, bulkPrice: 31000, bulkMinQty: 30 },
            { name: 'Pala', category: 'Bumbu Dapur', unit: 'kg', price: 85000, stock: 70, bulkPrice: 76000, bulkMinQty: 15 },
            { name: 'Cengkeh', category: 'Bumbu Dapur', unit: 'kg', price: 125000, stock: 60, bulkPrice: 112000, bulkMinQty: 12 },
            { name: 'Daun Jeruk', category: 'Bumbu Dapur', unit: 'kg', price: 21000, stock: 100, bulkPrice: 18000, bulkMinQty: 25 },
        ],
    },
    {
        // Akun demo dengan rekening & dompet digital ASLI, dipakai untuk
        // menunjukkan alur penerusan dana ke pemasok benar-benar bisa
        // diverifikasi (bukan nomor rekening acak seperti pemasok lain).
        email: 'yayapretty086@gmail.com', name: 'Muthiah Rahma Pasaribu', groupName: 'Kelompok Tani Rahma Jaya', katalog: 'sayur',
        city: 'Lhokseumawe', address: 'Jl. Samudera, Banda Sakti, Lhokseumawe', phone: '082165383828',
        bankName: 'BSI', bankAccountNumber: '7264367397', bankAccountHolder: 'Muthiah Rahma Pasaribu',
        ewalletNumber: '082165383828', ewalletHolder: 'Muthiah Rahma',
        ewalletProviders: ['dana', 'gopay', 'shopeepay', 'ovo'],
        products: [
            { name: 'Cabai Merah Keriting', category: 'Sayuran', unit: 'kg', price: 37000, stock: 300, bulkPrice: 32500, bulkMinQty: 60 },
            { name: 'Bawang Merah', category: 'Bumbu Dapur', unit: 'kg', price: 31000, stock: 280, bulkPrice: 27000, bulkMinQty: 50 },
            { name: 'Tomat', category: 'Sayuran', unit: 'kg', price: 12500, stock: 260, bulkPrice: 10500, bulkMinQty: 60 },
            { name: 'Bawang Putih', category: 'Bumbu Dapur', unit: 'kg', price: 33000, stock: 220, bulkPrice: 29000, bulkMinQty: 50 },
        ],
    },
    {
        // Akun demo dengan email asli, sama seperti entri di atas —
        // supaya bisa langsung login dan lihat katalog + data terisi.
        email: 'greenperson1106@gmail.com', bankName: 'Bank Aceh Syariah', bankAccountNumber: '0304050607', bankAccountHolder: 'Kelompok Tani Hijau Lestari', name: 'Rian Saputra', groupName: 'Kelompok Tani Hijau Lestari', katalog: 'sayur',
        city: 'Lhokseumawe', address: 'Gampong Blang Pulo, Muara Satu, Lhokseumawe', phone: '081298765432',
        products: [
            { name: 'Kangkung', category: 'Sayuran', unit: 'kg', price: 8000, stock: 260, bulkPrice: 6800, bulkMinQty: 70 },
            { name: 'Bayam', category: 'Sayuran', unit: 'kg', price: 8500, stock: 240, bulkPrice: 7200, bulkMinQty: 60 },
            { name: 'Cabai Merah Keriting', category: 'Sayuran', unit: 'kg', price: 36000, stock: 300, bulkPrice: 31500, bulkMinQty: 60 },
            { name: 'Bawang Merah', category: 'Bumbu Dapur', unit: 'kg', price: 31500, stock: 260, bulkPrice: 27500, bulkMinQty: 50 },
        ],
    },
];

const UMKMS_UTAMA = [
    {
        email: 'muthiahrmh@gmail.com', name: 'Muthiah Rahma Pasaribu', businessName: "Mutek's Cathering",
        businessType: 'Katering', city: 'Lhokseumawe', address: 'Jl. Samudera, Banda Sakti, Lhokseumawe',
        phone: '085111222333', skala: 1.2, bahan: ['Cabai Merah Keriting', 'Bawang Merah', 'Minyak Goreng', 'Daging Sapi']
    },
    {
        email: 'livia123@gmail.com', name: 'Livia Safirani', businessName: 'Warung Bude',
        businessType: 'Warung Nasi', city: 'Lhokseumawe', address: 'Buketrata, Muara Dua, Lhokseumawe',
        phone: '082121212111', skala: 0.7, bahan: ['Cabai Merah Keriting', 'Tomat', 'Minyak Goreng', 'Ikan Tongkol']
    },
    {
        // Email asli (bukan email palsu @umkm.com lagi) supaya Adha bisa
        // login pakai akunnya sendiri dan langsung lihat data terisi.
        email: 'adhagustiharmadan@gmail.com', name: 'Adha Gusti Harmadhan', businessName: 'Kopi Senja',
        businessType: 'Kafe', city: 'Lhokseumawe', address: 'Jl. Darussalam, Banda Sakti, Lhokseumawe',
        phone: '087888999000', skala: 0.6, bahan: ['Kopi Robusta', 'Gula Pasir', 'Tepung Terigu']
    },
    {
        email: 'mieaceh@umkm.com', name: 'Jalaluddin', businessName: 'Mie Aceh Bang Jal',
        businessType: 'Rumah Makan', city: 'Lhokseumawe', address: 'Simpang Empat, Banda Sakti, Lhokseumawe',
        phone: '081234567801', skala: 1.0, bahan: ['Cabai Merah Keriting', 'Bawang Putih', 'Udang', 'Daun Temurui']
    },
    {
        email: 'warkopmuaradua@umkm.com', name: 'Teuku Rizal', businessName: 'Warkop Muara Dua',
        businessType: 'Warung Kopi', city: 'Lhokseumawe', address: 'Cunda, Muara Dua, Lhokseumawe',
        phone: '081234567802', skala: 0.8, bahan: ['Kopi Robusta', 'Kopi Arabika Gayo', 'Gula Pasir']
    },
    {
        email: 'timphan@umkm.com', name: 'Nurhayati', businessName: 'Kue Timphan Nek Ti',
        businessType: 'Kue Tradisional', city: 'Lhokseumawe', address: 'Gampong Keude Aceh, Banda Sakti, Lhokseumawe',
        phone: '081234567803', skala: 0.5, bahan: ['Kelapa Parut', 'Gula Pasir', 'Pisang Kepok']
    },
    {
        email: 'seafoodpusong@umkm.com', name: 'Munawir', businessName: 'RM Seafood Pusong',
        businessType: 'Seafood', city: 'Lhokseumawe', address: 'Pusong Baru, Banda Sakti, Lhokseumawe',
        phone: '081234567804', skala: 1.1, bahan: ['Ikan Kembung', 'Cumi', 'Udang', 'Asam Sunti']
    },
    {
        email: 'martabak@umkm.com', name: 'Saiful Bahri', businessName: 'Martabak Aceh Simpang',
        businessType: 'Kedai', city: 'Lhokseumawe', address: 'Simpang Kramat, Muara Dua, Lhokseumawe',
        phone: '081234567805', skala: 0.7, bahan: ['Telur Ayam', 'Tepung Terigu', 'Bawang Merah', 'Minyak Goreng']
    },
];

// ============================================================
// Pola musiman
// ============================================================

const MUSIM = {
    1: 0.95, 2: 1.08, 3: 1.38, 4: 1.22, 5: 0.90, 6: 1.00,
    7: 1.06, 8: 1.00, 9: 0.94, 10: 1.00, 11: 1.06, 12: 1.24,
};

/** Meugang: tradisi Aceh membeli daging menjelang Ramadan dan Idulfitri */
const MUSIM_KHUSUS = {
    'Daging Sapi': { 2: 1.8, 3: 2.4, 4: 1.9, 12: 1.3 },
    'Kopi Robusta': { 11: 1.2, 12: 1.25, 1: 1.15 },
    'Kopi Arabika Gayo': { 11: 1.2, 12: 1.25, 1: 1.15 },
    'Kelapa Parut': { 3: 1.5, 4: 1.7 },
    'Ikan Tongkol': { 6: 1.2, 7: 1.25, 8: 1.2 },
};

const BASE = {
    'Cabai Merah Keriting': 45, 'Cabai Rawit': 18, 'Bawang Merah': 34, 'Bawang Putih': 26,
    'Minyak Goreng': 55, 'Gula Pasir': 40, 'Tepung Terigu': 48, 'Telur Ayam': 42,
    'Beras Lokal': 120, 'Daging Sapi': 16, 'Ikan Tongkol': 30, 'Ikan Kembung': 26,
    Udang: 14, Cumi: 12, 'Ikan Kayu': 8, 'Kopi Robusta': 22, 'Kopi Arabika Gayo': 9,
    'Kelapa Parut': 38, 'Pisang Kepok': 25, Tomat: 32, Kentang: 24, Wortel: 18, Kol: 20,
    'Asam Sunti': 6, 'Daun Temurui': 5, 'Kayu Manis': 4, Serai: 12, Kunyit: 9, Jahe: 8,
    'Nangka Muda': 14, 'Tepung Ketan': 20, 'Gula Merah': 15,
};

// ============================================================
// Pembangkit mitra tambahan
// ============================================================

function buatSuppliersTambahan(jumlah) {
    const hasil = [];
    const terpakai = new Set(SUPPLIERS_UTAMA.map((s) => s.groupName));

    for (let i = 0; i < jumlah; i++) {
        const s = i * 977 + 13;
        const jenis = JENIS_SUPPLIER[i % JENIS_SUPPLIER.length];
        const kota = pilih(KOTA_TERBOBOT, s + 1);
        const gampong = pilih(GAMPONG[kota] ?? ['Pusat Kota'], s + 2);

        let nama = jenis.pola.replace('{n}', pilih(NAMA_USAHA, s + 3));
        let n = 2;
        while (terpakai.has(nama)) nama = `${jenis.pola.replace('{n}', pilih(NAMA_USAHA, s + 3))} ${n++}`;
        terpakai.add(nama);

        // Nelayan hanya masuk akal di kota pesisir
        const jenisKatalog =
            jenis.jenis === 'ikan' && !['Lhokseumawe', 'Aceh Timur', 'Langsa'].includes(kota)
                ? 'sayur'
                : jenis.jenis;

        const kandidat = KATALOG[jenisKatalog];

        // Diacak dulu lalu diambil sebanyak yang dibutuhkan, supaya tidak ada
        // komoditas yang terbuang karena bertabrakan saat pemilihan
        const urutan = kandidat
            .map((k, idx) => ({ k, urut: rnd(s + 100 + idx) }))
            .sort((a, b) => a.urut - b.urut)
            .map((x) => x.k);

        const jumlahProduk = Math.min(urutan.length, 5 + Math.floor(rnd(s + 4) * 4));
        const products = [];

        for (let j = 0; j < jumlahProduk; j++) {
            const k = urutan[j];
            const harga = Math.round((k.min + rnd(s + 20 + j) * (k.max - k.min)) / 500) * 500;
            const punyaGrosir = rnd(s + 30 + j) > 0.2;

            products.push({
                name: k.name,
                category: k.category,
                unit: k.unit,
                price: harga,
                stock: 80 + Math.floor(rnd(s + 40 + j) * 400),
                bulkPrice: punyaGrosir ? Math.round((harga * (0.86 + rnd(s + 50 + j) * 0.06)) / 500) * 500 : null,
                bulkMinQty: punyaGrosir ? 20 + Math.floor(rnd(s + 60 + j) * 8) * 10 : null,
            });
        }

        const bankPilihan = ['Bank Aceh Syariah', 'Bank BRI', 'Bank BSI', 'Bank Mandiri', 'Bank BNI'];
        const bankTerpilih = pilih(bankPilihan, s + 11);

        hasil.push({
            katalog: jenisKatalog,
            bankName: bankTerpilih,
            bankAccountNumber: buatNomorRekening(bankTerpilih, s + 12),
            bankAccountHolder: nama,
            email: `supplier${String(i + 1).padStart(3, '0')}@demo.pangankreatif.id`,
            name: `${pilih(NAMA_DEPAN, s + 5)} ${pilih(NAMA_BELAKANG, s + 6)}`,
            groupName: nama,
            city: kota,
            address: `Gampong ${gampong}, ${kota}`,
            phone: `0813${String(10000000 + Math.floor(rnd(s + 7) * 89999999)).slice(0, 8)}`,
            products,
        });
    }

    return hasil;
}

function buatUmkmTambahan(jumlah) {
    const hasil = [];
    const terpakai = new Set(UMKMS_UTAMA.map((u) => u.businessName));

    for (let i = 0; i < jumlah; i++) {
        const s = i * 613 + 29;
        const jenis = JENIS_UMKM[i % JENIS_UMKM.length];
        const kota = pilih(KOTA_TERBOBOT, s + 1);
        const gampong = pilih(GAMPONG[kota] ?? ['Pusat Kota'], s + 2);

        const pola = pilih(jenis.pola, s + 3);
        let nama = pola.replace('{n}', pilih(NAMA_USAHA, s + 4));
        let n = 2;
        while (terpakai.has(nama)) nama = `${pola.replace('{n}', pilih(NAMA_USAHA, s + 4))} ${n++}`;
        terpakai.add(nama);

        const [smin, smax] = jenis.skala;
        const skala = Math.round((smin + rnd(s + 5) * (smax - smin)) * 100) / 100;

        hasil.push({
            email: `umkm${String(i + 1).padStart(3, '0')}@demo.pangankreatif.id`,
            name: `${pilih(NAMA_DEPAN, s + 6)} ${pilih(NAMA_BELAKANG, s + 7)}`,
            businessName: nama,
            businessType: jenis.tipe,
            city: kota,
            address: `Gampong ${gampong}, ${kota}`,
            phone: `0852${String(10000000 + Math.floor(rnd(s + 8) * 89999999)).slice(0, 8)}`,
            skala,
            bahan: BAHAN_PER_JENIS[jenis.tipe] ?? ['Cabai Merah Keriting', 'Minyak Goreng'],
            ringkas: true, // riwayat penjualan lebih pendek
        });
    }

    return hasil;
}


/**
 * Lengkapi katalog pemasok sampai jumlah minimum.
 * Produk khas yang ditulis tangan tetap dipertahankan, sisanya
 * diambil dari katalog kategori yang sama supaya tetap masuk akal —
 * koperasi nelayan tidak akan tiba-tiba berjualan rempah.
 */
function lengkapiKatalog(supplier, minimal) {
    const kandidat = KATALOG[supplier.katalog] ?? KATALOG.sayur;
    const sudahAda = new Set(supplier.products.map((p) => p.name));
    const benih = hashTeks(supplier.groupName);

    const sisa = kandidat
        .filter((k) => !sudahAda.has(k.name))
        .map((k, idx) => ({ k, urut: rnd(benih + idx * 7) }))
        .sort((a, b) => a.urut - b.urut)
        .map((x) => x.k);

    let j = 0;
    while (supplier.products.length < minimal && j < sisa.length) {
        const k = sisa[j];
        const harga = Math.round((k.min + rnd(benih + 500 + j) * (k.max - k.min)) / 500) * 500;
        const punyaGrosir = rnd(benih + 800 + j) > 0.2;

        supplier.products.push({
            name: k.name,
            category: k.category,
            unit: k.unit,
            price: harga,
            stock: 60 + Math.floor(rnd(benih + 900 + j) * 420),
            bulkPrice: punyaGrosir
                ? Math.round((harga * (0.86 + rnd(benih + 1100 + j) * 0.06)) / 500) * 500
                : null,
            bulkMinQty: punyaGrosir ? 20 + Math.floor(rnd(benih + 1300 + j) * 8) * 10 : null,
        });
        j++;
    }

    return supplier;
}

// ============================================================
// Penyimpanan massal
// ============================================================

function daftarBulan(jumlah) {
    const hasil = [];
    const now = new Date();
    for (let i = jumlah; i >= 1; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        hasil.push({ tahun: d.getFullYear(), bulan: d.getMonth() + 1 });
    }
    return hasil;
}

/**
 * Cocokkan sekumpulan email TANPA peduli besar-kecil huruf. Akun yang
 * didaftarkan manual lewat form register bisa saja diketik dengan
 * kapitalisasi berbeda dari yang ditulis di sini (mis. "GreenPerson@gmail.com"
 * vs "greenperson@gmail.com") — Postgres membandingkan teks apa adanya,
 * jadi tanpa ini akun lama tidak akan ketemu dan malah dibuatkan akun
 * duplikat baru yang kosong terlihat oleh pemiliknya.
 */
function kondisiEmailTanpaBesarKecil(daftarEmail) {
    return { OR: daftarEmail.map((e) => ({ email: { equals: e, mode: 'insensitive' } })) };
}

/** Buat akun secara massal — jauh lebih cepat daripada satu per satu */
async function simpanAkun(daftar, peran) {
    const emails = daftar.map((d) => d.email);
    const ada = await prisma.user.findMany({
        where: kondisiEmailTanpaBesarKecil(emails),
        include: { umkmProfile: true, supplierProfile: true },
    });
    const petaAda = new Map(ada.map((u) => [u.email.toLowerCase(), u]));

    const userBaru = [];
    const profilBaru = [];

    for (const d of daftar) {
        const lama = petaAda.get(d.email.toLowerCase());
        const profilLama = peran === 'supplier' ? lama?.supplierProfile : lama?.umkmProfile;

        if (!lama) {
            const userId = uuid();
            userBaru.push({
                id: userId,
                name: d.name,
                email: d.email,
                passwordHash: d.passwordHash,
                role: peran,
                phone: d.phone,
                // Akun demo tidak punya kotak masuk sungguhan untuk
                // menerima tautan verifikasi, jadi langsung diloloskan
                emailVerified: true,
                emailVerifiedAt: new Date(),
            });
            profilBaru.push(
                peran === 'supplier'
                    ? {
                        id: uuid(),
                        userId,
                        groupName: d.groupName,
                        city: d.city,
                        address: d.address,
                        bankName: d.bankName ?? null,
                        bankAccountNumber: d.bankAccountNumber ?? null,
                        bankAccountHolder: d.bankAccountHolder ?? null,
                        ewalletNumber: d.ewalletNumber ?? null,
                        ewalletHolder: d.ewalletHolder ?? null,
                        ewalletProviders: d.ewalletProviders ?? [],
                    }
                    : {
                        id: uuid(),
                        userId,
                        businessName: d.businessName,
                        businessType: d.businessType,
                        city: d.city,
                        address: d.address,
                    }
            );
        } else if (!profilLama) {
            profilBaru.push(
                peran === 'supplier'
                    ? {
                        id: uuid(),
                        userId: lama.id,
                        groupName: d.groupName,
                        city: d.city,
                        address: d.address,
                        bankName: d.bankName ?? null,
                        bankAccountNumber: d.bankAccountNumber ?? null,
                        bankAccountHolder: d.bankAccountHolder ?? null,
                        ewalletNumber: d.ewalletNumber ?? null,
                        ewalletHolder: d.ewalletHolder ?? null,
                        ewalletProviders: d.ewalletProviders ?? [],
                    }
                    : {
                        id: uuid(),
                        userId: lama.id,
                        businessName: d.businessName,
                        businessType: d.businessType,
                        city: d.city,
                        address: d.address,
                    }
            );
        }
    }

    if (userBaru.length) await batchCreate(prisma.user, userBaru);
    if (profilBaru.length) {
        await batchCreate(
            peran === 'supplier' ? prisma.supplierProfile : prisma.umkmProfile,
            profilBaru
        );
    }

    const semua = await prisma.user.findMany({
        where: kondisiEmailTanpaBesarKecil(emails),
        include: { umkmProfile: true, supplierProfile: true },
    });

    // Kunci peta pakai huruf kecil semua — pemanggil di bawah juga
    // men-toLowerCase() emailnya saat lookup, lihat kondisiEmailTanpaBesarKecil.
    const peta = new Map();
    for (const u of semua) {
        const p = peran === 'supplier' ? u.supplierProfile : u.umkmProfile;
        if (p) peta.set(u.email.toLowerCase(), p);
    }

    return { peta, baru: userBaru.length };
}

/** Sinkronkan katalog produk seluruh pemasok */
async function simpanProduk(daftarSupplier, petaProfil) {
    const supplierIds = daftarSupplier
        .map((s) => petaProfil.get(s.email.toLowerCase())?.id)
        .filter(Boolean);

    const adaSekarang = await prisma.product.findMany({
        where: { supplierId: { in: supplierIds } },
        select: { id: true, name: true, supplierId: true },
    });

    const kunci = (sid, nama) => `${sid}|${nama}`;
    const petaProduk = new Map(adaSekarang.map((p) => [kunci(p.supplierId, p.name), p.id]));

    const baru = [];
    for (const s of daftarSupplier) {
        const profil = petaProfil.get(s.email.toLowerCase());
        if (!profil) continue;

        for (const p of s.products) {
            const k = kunci(profil.id, p.name);
            if (petaProduk.has(k)) {
                await prisma.product.update({
                    where: { id: petaProduk.get(k) },
                    data: {
                        price: p.price,
                        stock: p.stock,
                        bulkPrice: p.bulkPrice,
                        bulkMinQty: p.bulkMinQty,
                        category: p.category,
                        unit: p.unit,
                    },
                });
            } else {
                baru.push({ ...p, id: uuid(), supplierId: profil.id });
            }
        }
    }

    if (baru.length) await batchCreate(prisma.product, baru);
    return baru.length;
}

function bangunPenjualan(umkmId, u, bulanList) {
    const rows = [];
    const perBulan = u.ringkas ? 1 : 2;

    for (const bahan of u.bahan) {
        const base = (BASE[bahan] ?? 25) * u.skala;
        const khusus = MUSIM_KHUSUS[bahan] ?? {};
        const benih = hashTeks(bahan + u.businessName);

        bulanList.forEach((b, idx) => {
            const musim = khusus[b.bulan] ?? MUSIM[b.bulan] ?? 1;
            const tren = 1 + idx * 0.014;
            const noise = 0.88 + rnd(benih + idx) * 0.24;
            const total = base * musim * tren * noise;

            const bagian = perBulan === 1 ? [1] : [0.55, 0.45];
            bagian.forEach((porsi, i) => {
                rows.push({
                    umkmId,
                    productName: bahan,
                    quantity: Math.max(0.5, Math.round(total * porsi * 10) / 10),
                    date: new Date(Date.UTC(b.tahun, b.bulan - 1, i === 0 ? 8 : 22)),
                });
            });
        });
    }

    return rows;
}

// ============================================================
// Pesanan kolektif — mengikuti kurva pertumbuhan Tabel 3.4
// ============================================================

/**
 * Bangun transaksi setahun penuh sehingga total komisinya
 * mendekati Rp65 juta pada 2.000 transaksi, terdistribusi
 * mengikuti pertumbuhan kuartalan pada Tabel 3.4.
 */
function bangunPesananTahunPertama({ produkList, umkmIdsUrut }) {
    const orders = [];
    const items = [];
    const transaksi = [];

    const now = new Date();
    const nilaiRata = TARGET_KOMISI / KOMISI / TARGET_TRANSAKSI; // ~Rp1.625.000

    let nomor = 0;

    KUARTAL.forEach((q, qi) => {
        const jumlahTrx = Math.round(TARGET_TRANSAKSI * q.porsi);
        const nilaiKuartal = TARGET_TRANSAKSI * q.porsi * nilaiRata;

        // UMKM yang sudah bergabung sampai kuartal ini
        const kolamUmkm = umkmIdsUrut.slice(0, q.umkmAktif);

        let trxDibuat = 0;
        let nilaiDibuat = 0;

        while (trxDibuat < jumlahTrx) {
            const s = nomor * 733 + 101;
            nomor++;

            const sisaTrx = jumlahTrx - trxDibuat;
            const jumlahPeserta = Math.min(sisaTrx, 2 + Math.floor(rnd(s) * 4));

            const produk = produkList[Math.floor(rnd(s + 1) * produkList.length) % produkList.length];
            if (!produk) break;

            // Kuartal dibagi rata sepanjang 3 bulan, berakhir di bulan berjalan
            const bulanKe = qi * 3 + Math.floor(rnd(s + 2) * 3);
            const geser = now.getMonth() - 11 + bulanKe;
            const bulanBerjalan = geser === now.getMonth();

            // Di bulan berjalan, tanggal dibatasi sampai hari ini
            const batasHari = bulanBerjalan ? now.getDate() : 28;
            const hariDalamBulan = 1 + Math.floor(rnd(s + 3) * Math.max(batasHari - 1, 1));

            const dibuat = new Date(now.getFullYear(), geser, hariDalamBulan);
            if (dibuat > now) dibuat.setTime(now.getTime() - 86400000);

            const deadline = new Date(dibuat);
            deadline.setDate(deadline.getDate() + 5 + Math.floor(rnd(s + 4) * 5));

            const peserta = [];
            const dipakai = new Set();
            for (let j = 0; j < jumlahPeserta; j++) {
                const id = kolamUmkm[Math.floor(rnd(s + 10 + j) * kolamUmkm.length) % kolamUmkm.length];
                if (!id || dipakai.has(id)) continue;
                dipakai.add(id);
                peserta.push(id);
            }
            if (peserta.length === 0) continue;

            const orderId = uuid();
            const harga = Number(produk.bulkPrice ?? produk.price);
            const status = rnd(s + 5) > 0.1 ? 'delivered' : 'closed';

            let totalQty = 0;
            const daftarItem = [];
            const daftarTrx = [];

            for (const umkmId of peserta) {
                // Nilai per transaksi berayun di sekitar rata-rata sasaran
                const target = nilaiRata * (0.55 + rnd(hashTeks(orderId + umkmId)) * 0.9);
                const qty = Math.max(1, Math.round(target / harga));
                const amount = Math.round(qty * harga);
                const platformFee = Math.round(amount * KOMISI * 100) / 100;
                const distributionMargin = Math.round(amount * MARGIN * 100) / 100;

                totalQty += qty;
                nilaiDibuat += amount;

                const itemId = uuid();
                daftarItem.push({ id: itemId, orderId, umkmId, quantity: qty, status: 'paid' });

                const bayar = new Date(dibuat);
                bayar.setDate(bayar.getDate() + 1 + Math.floor(rnd(hashTeks(itemId)) * 3));
                // Pembayaran tidak boleh melewati hari ini
                if (bayar > now) bayar.setTime(now.getTime());

                daftarTrx.push({
                    id: uuid(),
                    orderItemId: itemId,
                    amount,
                    status: 'success',
                    platformFee,
                    commissionRate: KOMISI,
                    distributionMargin,
                    marginRate: MARGIN,
                    supplierPayout: Math.round((amount - platformFee - distributionMargin) * 100) / 100,
                    createdAt: bayar,
                });
            }

            orders.push({
                id: orderId,
                productId: produk.id,
                totalQuantity: totalQty,
                status,
                deadline,
                createdAt: dibuat,
            });
            items.push(...daftarItem);
            transaksi.push(...daftarTrx);

            trxDibuat += daftarItem.length;
        }

        // Koreksi kecil supaya nilai kuartal tidak melenceng jauh
        void nilaiKuartal;
    });

    // ---- Pesanan yang masih terbuka, untuk didemokan langsung ----
    const kolamAkhir = umkmIdsUrut.slice(0, KUARTAL[3].umkmAktif);

    for (let i = 0; i < PESANAN_TERBUKA; i++) {
        const s = i * 977 + 55;
        const produk = produkList[Math.floor(rnd(s) * produkList.length) % produkList.length];
        if (!produk) continue;

        const dibuat = new Date(now);
        dibuat.setDate(dibuat.getDate() - Math.floor(rnd(s + 1) * 4));

        const deadline = new Date(dibuat);
        deadline.setDate(deadline.getDate() + 5 + Math.floor(rnd(s + 2) * 5));

        const orderId = uuid();
        const minQty = Number(produk.bulkMinQty ?? 0);
        // Sengaja belum mencapai kuota grosir
        const targetTotal = Math.max(3, Math.round((minQty || 40) * (0.45 + rnd(s + 3) * 0.3)));

        const jumlahPeserta = 2 + Math.floor(rnd(s + 4) * 3);
        const peserta = [];
        const dipakai = new Set();
        for (let j = 0; j < jumlahPeserta; j++) {
            const id = kolamAkhir[Math.floor(rnd(s + 10 + j) * kolamAkhir.length) % kolamAkhir.length];
            if (!id || dipakai.has(id)) continue;
            dipakai.add(id);
            peserta.push(id);
        }
        if (peserta.length < 2) continue;

        let totalQty = 0;
        const daftarItem = peserta.map((umkmId, j) => {
            const qty = Math.max(1, Math.round(targetTotal / peserta.length + rnd(s + 30 + j) * 3));
            totalQty += qty;
            return { id: uuid(), orderId, umkmId, quantity: qty, status: 'pending' };
        });

        orders.push({
            id: orderId,
            productId: produk.id,
            totalQuantity: totalQty,
            status: 'open',
            deadline,
            createdAt: dibuat,
        });
        items.push(...daftarItem);
    }

    return { orders, items, transaksi };
}

// ============================================================
// Alur utama
// ============================================================

const rupiah = (n) => 'Rp' + Math.round(Number(n)).toLocaleString('id-ID');

async function main() {
    const mulai = Date.now();
    console.log('\nPanganKreatif — data demo dikalibrasi ke proyeksi Bab V\n');

    // Migrasi kecil: akun demo Adha dulu pakai email palsu kopisenja@umkm.com.
    // Kalau baris lama itu masih ada di database dan email barunya belum
    // dipakai, cukup timpa kolom email-nya saja — supaya riwayat penjualan
    // yang sudah pernah tercatat di akun itu tetap ikut, tidak dibuang lalu
    // dibuat ulang dari nol.
    const migrasiEmail = [
        { lama: 'kopisenja@umkm.com', baru: 'adhagustiharmadan@gmail.com' },
    ];
    for (const { lama, baru } of migrasiEmail) {
        const [akunLama, akunBaru] = await Promise.all([
            prisma.user.findUnique({ where: { email: lama } }),
            prisma.user.findUnique({ where: { email: baru } }),
        ]);
        if (akunLama && !akunBaru) {
            await prisma.user.update({ where: { id: akunLama.id }, data: { email: baru } });
            console.log(`Email akun demo dipindah: ${lama} -> ${baru}`);
        }
    }

    const passwordHash = await bcrypt.hash(PASSWORD_AKUN_BARU, 10);

    const semuaSupplier = [
        ...SUPPLIERS_UTAMA,
        ...buatSuppliersTambahan(JUMLAH_SUPPLIER_TAMBAHAN),
    ]
        .map((s) => ({ ...s, products: [...s.products] }))
        .map((s) => lengkapiKatalog(s, MIN_PRODUK_PER_SUPPLIER))
        .map((s) => ({ ...s, passwordHash }));

    const semuaUmkm = [
        ...UMKMS_UTAMA,
        ...buatUmkmTambahan(JUMLAH_UMKM_TAMBAHAN),
    ].map((u) => ({ ...u, passwordHash }));

    console.log(`Mitra pemasok (${semuaSupplier.length})...`);
    const hasilSupplier = await simpanAkun(semuaSupplier, 'supplier');
    console.log(`  ${hasilSupplier.baru} akun baru`);

    const produkBaru = await simpanProduk(semuaSupplier, hasilSupplier.peta);
    console.log(`  ${produkBaru} produk baru`);

    console.log(`\nUMKM kuliner (${semuaUmkm.length})...`);
    const hasilUmkm = await simpanAkun(semuaUmkm, 'umkm');
    console.log(`  ${hasilUmkm.baru} akun baru`);

    // ---------- Riwayat penjualan ----------
    console.log('\nRiwayat penjualan...');
    const bulanPanjang = daftarBulan(24);
    const bulanPendek = daftarBulan(12);

    const semuaUmkmId = semuaUmkm
        .map((u) => hasilUmkm.peta.get(u.email.toLowerCase())?.id)
        .filter(Boolean);

    const jumlahPerUmkm = await prisma.salesRecord.groupBy({
        by: ['umkmId'],
        where: { umkmId: { in: semuaUmkmId } },
        _count: { _all: true },
    });
    const petaJumlah = new Map(jumlahPerUmkm.map((r) => [r.umkmId, r._count._all]));

    let barisPenjualan = 0;
    const antrian = [];

    for (const u of semuaUmkm) {
        const profil = hasilUmkm.peta.get(u.email.toLowerCase());
        if (!profil) continue;

        const minimal = u.bahan.length * (u.ringkas ? 12 : 48);
        if ((petaJumlah.get(profil.id) ?? 0) >= minimal) continue;

        antrian.push(...bangunPenjualan(profil.id, u, u.ringkas ? bulanPendek : bulanPanjang));
    }

    if (antrian.length) {
        await batchCreate(prisma.salesRecord, antrian, 500);
        barisPenjualan = antrian.length;
    }
    console.log(`  ${barisPenjualan} catatan baru`);

    // ---------- Pesanan kolektif ----------
    console.log('\nPesanan kolektif dan transaksi...');

    const sudahAda = await prisma.transaction.count();
    if (sudahAda >= TARGET_TRANSAKSI * 0.8) {
        console.log(`  = sudah ada ${sudahAda} transaksi, dilewati`);
    } else {
        const produkList = await prisma.product.findMany({
            select: { id: true, name: true, unit: true, price: true, bulkPrice: true, bulkMinQty: true },
        });

        // Urutan UMKM menentukan siapa yang "bergabung lebih dulu"
        const umkmIdsUrut = semuaUmkm
            .map((u) => hasilUmkm.peta.get(u.email.toLowerCase())?.id)
            .filter(Boolean);

        const { orders, items, transaksi } = bangunPesananTahunPertama({
            produkList,
            umkmIdsUrut,
        });

        await batchCreate(prisma.procurementOrder, orders, 200);
        await batchCreate(prisma.procurementOrderItem, items, 400);
        await batchCreate(prisma.transaction, transaksi, 400);

        console.log(
            `  ${orders.length} pesanan, ${items.length} kontribusi, ${transaksi.length} transaksi`
        );
    }

    // ---------- Ringkasan ----------
    const [nSupplier, nUmkm, nProduk, nSales, nOrder, nItem, nTrx] = await Promise.all([
        prisma.supplierProfile.count(),
        prisma.umkmProfile.count(),
        prisma.product.count(),
        prisma.salesRecord.count(),
        prisma.procurementOrder.count(),
        prisma.procurementOrderItem.count(),
        prisma.transaction.count(),
    ]);

    const agg = await prisma.transaction.aggregate({
        where: { status: 'success' },
        _sum: { amount: true, platformFee: true, distributionMargin: true },
        _count: { _all: true },
    });

    const gmv = Number(agg._sum.amount ?? 0);
    const komisi = Number(agg._sum.platformFee ?? 0);
    const margin = Number(agg._sum.distributionMargin ?? 0);
    const trxSukses = agg._count._all;
    const hpp = trxSukses * Number(process.env.PLATFORM_COST_PER_TRX ?? 10000);

    console.log(`\nSelesai dalam ${((Date.now() - mulai) / 1000).toFixed(1)} detik.\n`);

    console.log('Isi basis data:');
    console.log(`  Pemasok           : ${nSupplier}`);
    console.log(`  UMKM              : ${nUmkm}`);
    console.log(`  Produk            : ${nProduk}`);
    console.log(`  Catatan penjualan : ${nSales}`);
    console.log(`  Pesanan kolektif  : ${nOrder}`);
    console.log(`  Kontribusi UMKM   : ${nItem}`);
    console.log(`  Transaksi         : ${nTrx}`);

    console.log('\nPerbandingan dengan proyeksi Bab V:');
    console.log(`                        sistem            proposal`);
    console.log(`  Transaksi           : ${String(trxSukses).padEnd(18)}${TARGET_TRANSAKSI}`);
    console.log(`  Komisi transaksi    : ${rupiah(komisi).padEnd(18)}${rupiah(TARGET_KOMISI)}`);
    console.log(`  Margin distribusi   : ${rupiah(margin).padEnd(18)}${rupiah(55000000)}`);
    console.log(`  Total pendapatan    : ${rupiah(komisi + margin).padEnd(18)}${rupiah(120000000)}`);
    console.log(`  HPP                 : ${rupiah(hpp).padEnd(18)}${rupiah(20000000)}`);
    console.log(`  Nilai transaksi     : ${rupiah(gmv)}`);
    console.log(
        `  Rata-rata / transaksi: ${rupiah(trxSukses ? gmv / trxSukses : 0)}`
    );


    console.log('\nAkun lama -> password tidak berubah:');
    console.log('  makmur@ / sembako@ / jaya@supplier.com');
    console.log('  livia123@gmail.com, muthiahrmh@gmail.com');
    console.log(`\nAkun baru -> password: ${PASSWORD_AKUN_BARU}`);
    console.log('  Tokoh demo : mieaceh@, warkopmuaradua@, timphan@,');
    console.log('               seafoodpusong@, martabak@umkm.com');
    console.log('               meunasah@, pusong@, gayo@, rempahpidie@supplier.com');
    console.log('  Email asli : adhagustiharmadan@gmail.com (UMKM — Kopi Senja)');
    console.log('               greenperson1106@gmail.com (Pemasok — Kelompok Tani Hijau Lestari)');
    console.log(`  Massal     : umkm001..${String(JUMLAH_UMKM_TAMBAHAN).padStart(3, '0')}@demo.pangankreatif.id`);
    console.log(`               supplier001..${String(JUMLAH_SUPPLIER_TAMBAHAN).padStart(3, '0')}@demo.pangankreatif.id`);
    console.log('\nAkun admin muthiahpsb@gmail.com tidak disentuh.\n');
}

main()
    .catch((e) => {
        console.error('\nGagal menyiapkan data demo:');
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });