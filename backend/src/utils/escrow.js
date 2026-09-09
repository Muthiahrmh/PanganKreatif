/**
 * Rekening bersama (escrow) PanganKreatif.
 *
 * Uang UMKM masuk ke rekening platform lebih dulu. Sebelum berkas ini
 * ada, admin bisa langsung meneruskannya ke pemasok kapan saja — bahkan
 * ketika barangnya belum sampai. Sekarang dana itu ditahan sampai salah
 * satu dari tiga hal terjadi:
 *
 *   1. UMKM menekan "Barang Sudah Diterima"          → konfirmasi_umkm
 *   2. Batas waktu konfirmasi lewat tanpa kabar      → otomatis
 *   3. Admin melepas paksa karena sengketa           → admin_sengketa
 *
 * Ketiganya menulis kolom yang sama (escrowReleasedAt) dengan alasan
 * yang berbeda, jadi riwayatnya tetap bisa ditelusuri satu per satu.
 */

const prisma = require('./prisma');

// Berapa lama UMKM diberi waktu memeriksa barang sebelum pesanan
// dianggap beres dengan sendirinya. Bisa diubah lewat .env tanpa
// menyentuh kode.
const HARI_AUTO_KONFIRMASI = Number(process.env.ESCROW_AUTO_CONFIRM_DAYS ?? 3);

const ALASAN = {
    UMKM: 'konfirmasi_umkm',
    OTOMATIS: 'otomatis',
    ADMIN: 'admin_sengketa',
};

/** Batas konfirmasi otomatis, dihitung dari saat barang dinyatakan dikirim. */
function batasKonfirmasi(dariWaktu = new Date()) {
    const batas = new Date(dariWaktu);
    batas.setDate(batas.getDate() + HARI_AUTO_KONFIRMASI);
    return batas;
}

/** Sisa waktu konfirmasi dalam jam; null kalau memang tidak ada batas. */
function sisaJamKonfirmasi(autoConfirmAt) {
    if (!autoConfirmAt) return null;
    const selisih = new Date(autoConfirmAt).getTime() - Date.now();
    return Math.max(Math.ceil(selisih / 3_600_000), 0);
}

/**
 * Lepaskan dana satu item: tandai barangnya diterima, lalu buka kunci
 * seluruh transaksi berhasil milik item itu supaya muncul di daftar
 * "perlu diteruskan" milik admin.
 *
 * Dijalankan di dalam satu transaksi basis data supaya statusnya tidak
 * pernah setengah jadi — mustahil ada item "diterima" yang dananya masih
 * terkunci, atau sebaliknya.
 *
 * @param {string} itemId     kontribusi UMKM yang barangnya diterima
 * @param {object} opsi       { alasan, catatan, olehUserId }
 */
async function lepaskanDana(itemId, opsi = {}) {
    const { alasan = ALASAN.UMKM, catatan = null, olehUserId = null } = opsi;
    const sekarang = new Date();

    return prisma.$transaction(async (tx) => {
        const item = await tx.procurementOrderItem.update({
            where: { id: itemId },
            data: {
                fulfillmentStatus: 'diterima',
                receivedAt: sekarang,
                receivedNote: catatan,
                // Hitungan mundur tidak relevan lagi setelah diterima
                autoConfirmAt: null,
            },
        });

        const { count } = await tx.transaction.updateMany({
            where: {
                orderItemId: itemId,
                status: 'success',
                escrowReleasedAt: null,
            },
            data: {
                escrowReleasedAt: sekarang,
                escrowReleaseReason: alasan,
                escrowReleaseNote: catatan,
                escrowReleasedBy: olehUserId,
            },
        });

        return { item, jumlahTransaksi: count };
    });
}

/**
 * Lepaskan semua item yang batas konfirmasinya sudah lewat.
 *
 * Sengaja dibuat murah dan aman dipanggil berkali-kali: kalau tidak ada
 * yang jatuh tempo, hanya satu kueri ringan yang jalan. Karena itu dia
 * dipanggil dari dua tempat — penjadwal berkala di server.js, dan setiap
 * kali halaman payout admin dibuka — supaya angka yang dilihat admin
 * selalu yang terbaru walau penjadwalnya sempat mati.
 */
async function jalankanAutoKonfirmasi() {
    const jatuhTempo = await prisma.procurementOrderItem.findMany({
        where: {
            fulfillmentStatus: 'dikirim',
            autoConfirmAt: { not: null, lte: new Date() },
        },
        select: { id: true },
        take: 200,
    });

    let dilepas = 0;
    for (const { id } of jatuhTempo) {
        try {
            await lepaskanDana(id, {
                alasan: ALASAN.OTOMATIS,
                catatan: `Dikonfirmasi otomatis setelah ${HARI_AUTO_KONFIRMASI} hari tanpa tanggapan UMKM`,
            });
            dilepas += 1;
        } catch (err) {
            // Satu item bermasalah tidak boleh menggagalkan sisanya
            console.error(`Auto-konfirmasi gagal untuk item ${id}:`, err.message);
        }
    }

    return dilepas;
}

/**
 * Penjadwal sederhana. Tidak memakai pustaka cron karena yang dibutuhkan
 * hanya satu pemeriksaan berkala, dan prosesnya memang satu container.
 */
function mulaiPenjadwalAutoKonfirmasi(menit = 30) {
    const jalan = () => {
        jalankanAutoKonfirmasi()
            .then((n) => {
                if (n > 0) console.log(`Auto-konfirmasi: ${n} pesanan dilepas ke pemasok`);
            })
            .catch((err) => console.error('Auto-konfirmasi gagal:', err.message));
    };

    jalan(); // sekali saat server menyala, menutupi waktu server mati
    const timer = setInterval(jalan, menit * 60_000);
    timer.unref?.(); // jangan menahan proses saat hendak berhenti
    return timer;
}

/** Label siap pakai untuk antarmuka, supaya istilahnya seragam. */
const LABEL_FULFILLMENT = {
    menunggu: 'Menunggu Dikirim',
    dikirim: 'Dalam Pengiriman',
    diterima: 'Barang Diterima',
    komplain: 'Komplain Diproses',
};

module.exports = {
    ALASAN,
    HARI_AUTO_KONFIRMASI,
    LABEL_FULFILLMENT,
    batasKonfirmasi,
    sisaJamKonfirmasi,
    lepaskanDana,
    jalankanAutoKonfirmasi,
    mulaiPenjadwalAutoKonfirmasi,
};
