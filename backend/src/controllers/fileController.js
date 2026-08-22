const prisma = require('../utils/prisma');
const storage = require('../utils/supabaseStorage');

/**
 * Penyaji berkas bukti.
 *
 * Bukti pembayaran dan bukti penerusan dana disimpan di bucket
 * privat. Berkasnya hanya bisa diakses lewat URL bertanda tangan
 * yang diterbitkan di sini, setelah dipastikan pemintanya memang
 * berhak melihatnya.
 *
 * Yang berhak:
 *   Bukti bayar     — UMKM pembayar, pemasok penerima, admin
 *   Bukti penerusan — pemasok penerima dana, admin
 */

async function bolehMelihat(user, transaksi, jenis) {
    if (user.role === 'admin') return true;

    const umkmId = transaksi.orderItem?.umkmId;
    const supplierId = transaksi.orderItem?.order?.product?.supplierId;

    if (user.role === 'umkm') {
        // UMKM tidak perlu melihat bukti penerusan dana ke pemasok —
        // itu urusan antara platform dan pemasok
        if (jenis !== 'bayar') return false;

        const profil = await prisma.umkmProfile.findUnique({
            where: { userId: user.id },
            select: { id: true },
        });
        return Boolean(profil && profil.id === umkmId);
    }

    if (user.role === 'supplier') {
        const profil = await prisma.supplierProfile.findUnique({
            where: { userId: user.id },
            select: { id: true },
        });
        return Boolean(profil && profil.id === supplierId);
    }

    return false;
}

/**
 * GET /api/files/transaksi/:id/:jenis
 * jenis: 'bayar' untuk bukti transfer UMKM, 'payout' untuk bukti
 * penerusan dana dari platform ke pemasok.
 */
async function tautanBukti(req, res) {
    const { id, jenis } = req.params;

    if (!['bayar', 'payout'].includes(jenis)) {
        return res.status(400).json({ error: 'Jenis bukti tidak dikenali' });
    }

    const transaksi = await prisma.transaction.findUnique({
        where: { id },
        select: {
            paymentProofUrl: true,
            paymentProofPath: true,
            payoutProofUrl: true,
            payoutProofPath: true,
            orderItem: {
                select: {
                    umkmId: true,
                    order: { select: { product: { select: { supplierId: true } } } },
                },
            },
        },
    });

    if (!transaksi) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

    const berhak = await bolehMelihat(req.user, transaksi, jenis);
    if (!berhak) {
        return res.status(403).json({ error: 'Kamu tidak berhak melihat bukti ini' });
    }

    // Utamakan jalur tersimpan; data lama hanya punya URL publik
    const jalur =
        jenis === 'bayar'
            ? transaksi.paymentProofPath || storage.jalurDariUrl(transaksi.paymentProofUrl)
            : transaksi.payoutProofPath || storage.jalurDariUrl(transaksi.payoutProofUrl);

    if (!jalur) {
        return res.status(404).json({ error: 'Bukti belum diunggah' });
    }

    if (!storage.isConfigured()) {
        return res.status(503).json({ error: 'Penyimpanan berkas belum dikonfigurasi' });
    }

    try {
        const url = await storage.urlBertandaTangan(jalur, 300);
        // Tautan sengaja berumur pendek supaya tidak bisa disebar
        res.json({ url, berlakuDetik: 300 });
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
}

module.exports = { tautanBukti };