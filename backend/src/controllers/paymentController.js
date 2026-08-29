const crypto = require('crypto');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const midtrans = require('../utils/midtrans');
const { splitPayment, resolveUnitPrice } = require('../utils/pricing');

/**
 * Terapkan hasil pembayaran ke basis data.
 * Dipakai bersama oleh webhook dan pengecekan status manual,
 * supaya keduanya tidak bisa berbeda hasil.
 */
async function terapkanHasil(transaksi, notif) {
    const status = midtrans.terjemahkanStatus(notif);
    const kanal = midtrans.namaKanal(notif);

    // Sudah final dan tidak berubah, tidak perlu ditulis ulang
    if (transaksi.status === status && transaksi.paymentChannel === kanal) {
        return { status, kanal, berubah: false };
    }

    await prisma.$transaction(async (tx) => {
        await tx.transaction.update({
            where: { id: transaksi.id },
            data: {
                status,
                paymentChannel: kanal,
                paidAt: status === 'success' ? new Date(notif.settlement_time || Date.now()) : null,
            },
        });

        await tx.procurementOrderItem.update({
            where: { id: transaksi.orderItemId },
            data: { status: status === 'success' ? 'paid' : 'pending' },
        });
    });

    return { status, kanal, berubah: true };
}

// ---------- POST /api/payments/items/:itemId ----------

const buatSchema = z.object({
    // Boleh dikosongkan; kalau kosong, nilainya dihitung dari pesanan
    amount: z.number().positive().optional(),
});

async function buatPembayaran(req, res) {
    if (!midtrans.terkonfigurasi()) {
        return res.status(503).json({
            error:
                'Pembayaran daring belum aktif. Isi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di .env backend.',
        });
    }

    const parsed = buatSchema.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const umkmProfile = await prisma.umkmProfile.findUnique({
        where: { userId: req.user.id },
        include: { user: true },
    });
    if (!umkmProfile) return res.status(403).json({ error: 'Bukan akun UMKM' });

    const item = await prisma.procurementOrderItem.findUnique({
        where: { id: req.params.itemId },
        include: {
            order: { include: { product: { include: { supplier: true } } } },
            transactions: true,
        },
    });

    if (!item || item.umkmId !== umkmProfile.id) {
        return res.status(403).json({ error: 'Pesanan tidak ditemukan atau bukan milik anda' });
    }
    if (item.status === 'paid') {
        return res.status(400).json({ error: 'Pesanan ini sudah lunas' });
    }

    // Kalau sudah ada sesi yang masih menunggu, pakai ulang tokennya
    const menunggu = item.transactions.find(
        (t) => t.status === 'pending' && t.snapToken && t.gatewayOrderId
    );
    if (menunggu) {
        return res.json({
            transactionId: menunggu.id,
            orderId: menunggu.gatewayOrderId,
            snapToken: menunggu.snapToken,
            amount: Number(menunggu.amount),
            clientKey: midtrans.CLIENT_KEY,
            produksi: midtrans.PRODUKSI,
            dipakaiUlang: true,
        });
    }

    // Nilai dihitung ulang di server — jangan percaya angka dari browser
    const harga = resolveUnitPrice(item.order.product, item.order.totalQuantity);
    const nilai = Math.round(Number(item.quantity) * harga.unitPrice);

    if (!nilai || nilai < 1) {
        return res.status(400).json({ error: 'Nilai pembayaran tidak valid' });
    }

    const bagi = splitPayment(nilai);
    const transaksiId = crypto.randomUUID();
    // Awalan PK memudahkan penelusuran di dasbor Midtrans
    const orderId = `PK-${transaksiId.slice(0, 8)}-${Date.now().toString(36)}`;

    const produk = item.order.product;

    let sesi;
    try {
        sesi = await midtrans.buatSesiPembayaran({
            orderId,
            amount: nilai,
            pelanggan: {
                first_name: umkmProfile.businessName?.slice(0, 40) || umkmProfile.user.name,
                email: umkmProfile.user.email,
                phone: umkmProfile.user.phone || undefined,
            },
            rincian: [
                {
                    id: produk.id.slice(0, 40),
                    name: `${produk.name} (${item.quantity} ${produk.unit})`.slice(0, 50),
                    price: nilai,
                    quantity: 1,
                },
            ],
            finishUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/procurement`,
        });
    } catch (err) {
        return res.status(502).json({ error: err.message });
    }

    let transaksi;
    try {
        transaksi = await prisma.transaction.create({
            data: {
                id: transaksiId,
                orderItemId: item.id,
                amount: bagi.amount,
                status: 'pending',
                platformFee: bagi.platformFee,
                commissionRate: bagi.commissionRate,
                distributionMargin: bagi.distributionMargin,
                marginRate: bagi.marginRate,
                supplierPayout: bagi.supplierPayout,
                gatewayOrderId: orderId,
                snapToken: sesi.token,
            },
        });
    } catch (err) {
        // P2002: index parsial transactions_pending_per_item kena —
        // request lain menang lebih dulu (klik dobel/retry jaringan).
        // Sesi Snap yang baru dibuat di atas dibuang, dan sesi milik
        // pemenang race dipakai supaya pengguna tidak melihat error.
        if (err.code === 'P2002') {
            const punyaOrang = await prisma.transaction.findFirst({
                where: { orderItemId: item.id, status: 'pending' },
                orderBy: { createdAt: 'desc' },
            });
            if (punyaOrang) {
                return res.json({
                    transactionId: punyaOrang.id,
                    orderId: punyaOrang.gatewayOrderId,
                    snapToken: punyaOrang.snapToken,
                    amount: Number(punyaOrang.amount),
                    clientKey: midtrans.CLIENT_KEY,
                    produksi: midtrans.PRODUKSI,
                    dipakaiUlang: true,
                });
            }
        }
        throw err;
    }

    res.status(201).json({
        transactionId: transaksi.id,
        orderId,
        snapToken: sesi.token,
        redirectUrl: sesi.redirectUrl,
        amount: nilai,
        clientKey: midtrans.CLIENT_KEY,
        produksi: midtrans.PRODUKSI,
    });
}

// ---------- POST /api/payments/notification ----------

/**
 * Webhook dari Midtrans. Terbuka tanpa autentikasi karena dipanggil
 * dari luar, keasliannya dijamin lewat tanda tangan SHA-512.
 */
async function terimaNotifikasi(req, res) {
    const notif = req.body;

    if (!midtrans.tandaTanganSah(notif)) {
        console.warn('Notifikasi Midtrans ditolak: tanda tangan tidak cocok');
        return res.status(403).json({ error: 'Tanda tangan tidak sah' });
    }

    const transaksi = await prisma.transaction.findUnique({
        where: { gatewayOrderId: notif.order_id },
    });

    if (!transaksi) {
        // Balas 200 supaya Midtrans berhenti mengulang untuk pesanan asing
        console.warn('Notifikasi untuk pesanan tak dikenal:', notif.order_id);
        return res.json({ diterima: true, dikenal: false });
    }

    const hasil = await terapkanHasil(transaksi, notif);
    console.log(`Pembayaran ${notif.order_id}: ${hasil.status} lewat ${hasil.kanal}`);

    res.json({ diterima: true });
}

// ---------- GET /api/payments/:transactionId/status ----------

/**
 * Pengecekan status manual.
 * Selama backend masih di localhost, Midtrans tidak bisa memanggil
 * webhook, jadi frontend menanyakan sendiri setelah pengguna
 * selesai membayar.
 */
async function periksaStatus(req, res) {
    const transaksi = await prisma.transaction.findUnique({
        where: { id: req.params.transactionId },
        include: { orderItem: { include: { umkm: true } } },
    });

    if (!transaksi) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

    // UMKM hanya boleh memeriksa transaksinya sendiri
    if (req.user.role === 'umkm') {
        const profil = await prisma.umkmProfile.findUnique({ where: { userId: req.user.id } });
        if (!profil || transaksi.orderItem.umkmId !== profil.id) {
            return res.status(403).json({ error: 'Bukan transaksi anda' });
        }
    }

    if (!transaksi.gatewayOrderId) {
        return res.json({
            status: transaksi.status,
            channel: transaksi.paymentChannel,
            daring: false,
            keterangan: 'Pembayaran manual, dikonfirmasi oleh pemasok.',
        });
    }

    let notif;
    try {
        notif = await midtrans.cekStatus(transaksi.gatewayOrderId);
    } catch (err) {
        return res.status(502).json({ error: err.message });
    }

    const hasil = await terapkanHasil(transaksi, notif);

    res.json({
        status: hasil.status,
        channel: hasil.kanal,
        daring: true,
        orderId: transaksi.gatewayOrderId,
        amount: Number(transaksi.amount),
    });
}

// ---------- GET /api/payments/info ----------

/**
 * Informasi pembayaran tingkat platform.
 *
 * Rekening di sini adalah rekening penampungan PanganKreatif.
 * Semua pembayaran UMKM masuk ke sini lebih dulu, komisi dipotong,
 * lalu sisanya diteruskan ke rekening pemasok.
 */
async function infoPembayaran(req, res) {
    res.json({
        gatewayAktif: midtrans.terkonfigurasi(),
        komisiPersen: Number(process.env.PLATFORM_COMMISSION_RATE ?? 0.02) * 100,
        kanalManual: daftarKanalManual(),
    });
}

/**
 * Tujuan pembayaran manual, dibaca dari .env.
 * Semuanya rekening penampungan platform — bukan rekening pemasok.
 */
function daftarKanalManual() {
    const kanal = [];

    const bank = process.env.PLATFORM_BANK_NAME;
    const norek = process.env.PLATFORM_BANK_ACCOUNT;
    const pemilik = process.env.PLATFORM_BANK_HOLDER || 'PanganKreatif';

    if (bank && norek) {
        kanal.push({
            kode: 'bank',
            nama: bank,
            jenis: 'bank',
            tujuan: norek,
            atasNama: pemilik,
            keterangan: 'Transfer antarbank',
        });
    }

    const nomorEwallet = process.env.PLATFORM_EWALLET_NUMBER;
    const pemilikEwallet = process.env.PLATFORM_EWALLET_HOLDER || pemilik;

    if (nomorEwallet) {
        const daftar = (process.env.PLATFORM_EWALLET_LIST || 'gopay,shopeepay,dana,ovo')
            .split(',')
            .map((x) => x.trim().toLowerCase())
            .filter(Boolean);

        const label = {
            gopay: 'GoPay',
            shopeepay: 'ShopeePay',
            dana: 'DANA',
            ovo: 'OVO',
            linkaja: 'LinkAja',
        };

        for (const d of daftar) {
            kanal.push({
                kode: d,
                nama: label[d] || d.toUpperCase(),
                jenis: 'ewallet',
                tujuan: nomorEwallet,
                atasNama: pemilikEwallet,
                keterangan: 'Transfer ke nomor e-wallet',
            });
        }
    }

    kanal.push({
        kode: 'cash',
        nama: 'Tunai saat terima',
        jenis: 'cash',
        tujuan: null,
        atasNama: null,
        keterangan: 'Bayar langsung ke pemasok',
    });

    return kanal;
}

// ---------- DELETE /api/payments/:transactionId ----------

/**
 * Batalkan pembayaran yang masih menunggu, supaya UMKM bisa
 * memilih cara bayar lain. Hanya yang berstatus pending.
 */
async function batalkanPembayaran(req, res) {
    const transaksi = await prisma.transaction.findUnique({
        where: { id: req.params.transactionId },
        include: { orderItem: true },
    });

    if (!transaksi) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

    const profil = await prisma.umkmProfile.findUnique({ where: { userId: req.user.id } });
    if (!profil || transaksi.orderItem.umkmId !== profil.id) {
        return res.status(403).json({ error: 'Bukan transaksi anda' });
    }

    if (transaksi.status !== 'pending') {
        return res.status(400).json({
            error: 'Hanya pembayaran yang masih menunggu yang bisa dibatalkan',
        });
    }

    await prisma.$transaction(async (tx) => {
        await tx.transaction.update({
            where: { id: transaksi.id },
            data: { status: 'failed', payoutNote: 'Dibatalkan oleh UMKM' },
        });
        await tx.procurementOrderItem.update({
            where: { id: transaksi.orderItemId },
            data: { status: 'pending' },
        });
    });

    res.json({ dibatalkan: true });
}

module.exports = {
    daftarKanalManual,
    buatPembayaran,
    terimaNotifikasi,
    periksaStatus,
    infoPembayaran,
    batalkanPembayaran,
};