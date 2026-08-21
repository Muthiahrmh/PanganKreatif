/**
 * Integrasi payment gateway Midtrans Snap.
 *
 * Satu integrasi menutup semua kanal: GoPay, ShopeePay, QRIS
 * (yang juga melayani DANA, OVO, LinkAja), kartu kredit/debit,
 * dan transfer bank virtual account.
 *
 * Memakai fetch bawaan Node, tanpa pustaka tambahan.
 */

const crypto = require('crypto');

const PRODUKSI = String(process.env.MIDTRANS_IS_PRODUCTION ?? 'false') === 'true';
const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || '';

const SNAP_BASE = PRODUKSI
    ? 'https://app.midtrans.com/snap/v1'
    : 'https://app.sandbox.midtrans.com/snap/v1';

const API_BASE = PRODUKSI
    ? 'https://api.midtrans.com/v2'
    : 'https://api.sandbox.midtrans.com/v2';

/** Kanal pembayaran yang diaktifkan pada halaman Snap */
const KANAL = [
    'gopay',
    'shopeepay',
    'other_qris',
    'credit_card',
    'bca_va',
    'bni_va',
    'bri_va',
    'permata_va',
    'echannel',
    'indomaret',
    'alfamart',
];

function terkonfigurasi() {
    return Boolean(SERVER_KEY && CLIENT_KEY);
}

function headerAuth() {
    const basic = Buffer.from(`${SERVER_KEY}:`).toString('base64');
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${basic}`,
    };
}

async function panggil(url, opsi = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const res = await fetch(url, { ...opsi, headers: headerAuth(), signal: controller.signal });
        const teks = await res.text();

        let json;
        try {
            json = JSON.parse(teks);
        } catch {
            throw new Error(`Midtrans membalas bukan JSON: ${teks.slice(0, 200)}`);
        }

        if (!res.ok) {
            const pesan = Array.isArray(json.error_messages)
                ? json.error_messages.join(', ')
                : json.status_message || `status ${res.status}`;
            throw new Error(`Midtrans: ${pesan}`);
        }

        return json;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Buat sesi pembayaran Snap.
 * @returns {Promise<{token: string, redirectUrl: string}>}
 */
async function buatSesiPembayaran({
    orderId,
    amount,
    pelanggan,
    rincian,
    finishUrl,
}) {
    if (!terkonfigurasi()) {
        throw new Error(
            'Payment gateway belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di .env backend.'
        );
    }

    const body = {
        transaction_details: {
            order_id: orderId,
            // Midtrans hanya menerima bilangan bulat rupiah
            gross_amount: Math.round(amount),
        },
        enabled_payments: KANAL,
        item_details: rincian,
        customer_details: pelanggan,
        credit_card: { secure: true },
        expiry: { unit: 'hours', duration: 24 },
        ...(finishUrl ? { callbacks: { finish: finishUrl } } : {}),
    };

    const json = await panggil(`${SNAP_BASE}/transactions`, {
        method: 'POST',
        body: JSON.stringify(body),
    });

    return { token: json.token, redirectUrl: json.redirect_url };
}

/** Tanya langsung ke Midtrans status sebuah pesanan */
async function cekStatus(orderId) {
    if (!terkonfigurasi()) throw new Error('Payment gateway belum dikonfigurasi.');
    return panggil(`${API_BASE}/${encodeURIComponent(orderId)}/status`, { method: 'GET' });
}

/**
 * Verifikasi keaslian webhook.
 * Tanpa ini, siapa pun bisa mengirim notifikasi palsu dan
 * menandai pesanan sebagai lunas.
 */
function tandaTanganSah(notif) {
    const { order_id, status_code, gross_amount, signature_key } = notif || {};
    if (!order_id || !status_code || !gross_amount || !signature_key) return false;

    const hitung = crypto
        .createHash('sha512')
        .update(`${order_id}${status_code}${gross_amount}${SERVER_KEY}`)
        .digest('hex');

    // Perbandingan waktu tetap, supaya tidak bocor lewat selisih waktu
    const a = Buffer.from(hitung);
    const b = Buffer.from(String(signature_key));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Terjemahkan status Midtrans ke status transaksi kita.
 * @returns {'success'|'pending'|'failed'}
 */
function terjemahkanStatus(notif) {
    const s = notif.transaction_status;
    const fraud = notif.fraud_status;

    if (s === 'capture') return fraud === 'accept' ? 'success' : 'pending';
    if (s === 'settlement') return 'success';
    if (s === 'pending') return 'pending';
    // deny, cancel, expire, failure
    return 'failed';
}

/** Nama kanal yang enak dibaca pengguna */
const NAMA_KANAL = {
    gopay: 'GoPay',
    shopeepay: 'ShopeePay',
    qris: 'QRIS',
    other_qris: 'QRIS',
    credit_card: 'Kartu Kredit/Debit',
    bank_transfer: 'Transfer Bank',
    echannel: 'Mandiri Bill',
    bca_va: 'BCA Virtual Account',
    bni_va: 'BNI Virtual Account',
    bri_va: 'BRI Virtual Account',
    permata_va: 'Permata Virtual Account',
    cstore: 'Gerai Ritel',
    indomaret: 'Indomaret',
    alfamart: 'Alfamart',
};

function namaKanal(notif) {
    const tipe = notif.payment_type;
    if (tipe === 'bank_transfer') {
        const bank = notif.va_numbers?.[0]?.bank;
        return bank ? `${bank.toUpperCase()} Virtual Account` : 'Transfer Bank';
    }
    if (tipe === 'qris') {
        const penerbit = notif.acquirer;
        return penerbit ? `QRIS (${penerbit})` : 'QRIS';
    }
    if (tipe === 'cstore') {
        return NAMA_KANAL[notif.store] || 'Gerai Ritel';
    }
    return NAMA_KANAL[tipe] || tipe || 'Tidak diketahui';
}

module.exports = {
    terkonfigurasi,
    buatSesiPembayaran,
    cekStatus,
    tandaTanganSah,
    terjemahkanStatus,
    namaKanal,
    KANAL,
    PRODUKSI,
    CLIENT_KEY,
};