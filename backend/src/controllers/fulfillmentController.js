/**
 * Serah terima barang.
 *
 * Alur lengkapnya, dari uang masuk sampai uang keluar:
 *
 *   UMKM bayar          → transaksi success, item "paid"
 *   Pemasok kirim       → fulfillment "dikirim", hitungan mundur mulai
 *   UMKM terima         → fulfillment "diterima", dana dibuka kuncinya
 *   Admin teruskan      → payout "paid"
 *
 * Langkah ketiga tidak bisa dilompati. Yang bisa menggantikannya cuma
 * dua: batas waktu yang habis (utils/escrow.js), atau pelepasan paksa
 * oleh admin yang alasannya wajib diisi.
 */

const { z } = require('zod');
const prisma = require('../utils/prisma');
const escrow = require('../utils/escrow');

// ---------- helper ----------

/** Ambil item + pastikan miliknya UMKM yang sedang login. */
async function itemMilikUmkm(req, res) {
    const profil = await prisma.umkmProfile.findUnique({ where: { userId: req.user.id } });
    if (!profil) {
        res.status(403).json({ error: 'Bukan akun UMKM' });
        return null;
    }

    const item = await prisma.procurementOrderItem.findUnique({
        where: { id: req.params.itemId },
        include: { order: { include: { product: { include: { supplier: true } } } } },
    });

    if (!item || item.umkmId !== profil.id) {
        res.status(403).json({ error: 'Pesanan tidak ditemukan atau bukan milik anda' });
        return null;
    }

    return item;
}

/** Ambil item + pastikan pesanannya berasal dari pemasok yang login. */
async function itemMilikPemasok(req, res) {
    const profil = await prisma.supplierProfile.findUnique({ where: { userId: req.user.id } });
    if (!profil) {
        res.status(403).json({ error: 'Bukan akun pemasok' });
        return null;
    }

    const item = await prisma.procurementOrderItem.findUnique({
        where: { id: req.params.itemId },
        include: { order: { include: { product: true } }, umkm: true },
    });

    if (!item || item.order.product.supplierId !== profil.id) {
        res.status(403).json({ error: 'Pesanan ini bukan dari order anda' });
        return null;
    }

    return item;
}

// ---------- POST /api/procurement/items/:itemId/kirim ----------

/**
 * Pemasok menyatakan barang milik satu UMKM sudah berangkat.
 *
 * Baru boleh dilakukan setelah UMKM itu melunasi bagiannya — kalau
 * belum, tidak ada dana yang perlu ditahan dan tidak ada yang perlu
 * dikonfirmasi.
 */
async function tandaiDikirim(req, res) {
    const item = await itemMilikPemasok(req, res);
    if (!item) return;

    if (item.status !== 'paid') {
        return res.status(400).json({
            error: `${item.umkm.businessName} belum melunasi pesanannya, jadi belum bisa ditandai dikirim`,
        });
    }

    if (item.fulfillmentStatus === 'diterima') {
        return res.status(400).json({ error: 'Pesanan ini sudah dikonfirmasi diterima' });
    }

    if (item.fulfillmentStatus === 'dikirim') {
        return res.status(400).json({ error: 'Pesanan ini sudah ditandai dikirim' });
    }

    const sekarang = new Date();
    const diperbarui = await prisma.procurementOrderItem.update({
        where: { id: item.id },
        data: {
            fulfillmentStatus: 'dikirim',
            shippedAt: sekarang,
            autoConfirmAt: escrow.batasKonfirmasi(sekarang),
            // Komplain lama dianggap selesai kalau barangnya dikirim ulang
            complaintAt: null,
            complaintNote: null,
        },
    });

    res.json({
        ...diperbarui,
        quantity: Number(diperbarui.quantity),
        batasKonfirmasiHari: escrow.HARI_AUTO_KONFIRMASI,
    });
}

// ---------- POST /api/procurement/items/:itemId/terima ----------

const terimaSchema = z.object({
    catatan: z.string().max(300).optional(),
});

/**
 * UMKM menekan "Barang Sudah Diterima".
 *
 * Inilah satu-satunya tombol yang membuka kunci dana pemasok pada alur
 * normal — sengaja dipegang pembeli, bukan admin dan bukan pemasok.
 */
async function konfirmasiDiterima(req, res) {
    const parsed = terimaSchema.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const item = await itemMilikUmkm(req, res);
    if (!item) return;

    if (item.status !== 'paid') {
        return res.status(400).json({ error: 'Selesaikan pembayaran dulu sebelum konfirmasi penerimaan' });
    }

    if (item.fulfillmentStatus === 'diterima') {
        return res.status(400).json({ error: 'Pesanan ini sudah dikonfirmasi sebelumnya' });
    }

    if (item.fulfillmentStatus === 'menunggu') {
        return res.status(400).json({
            error: 'Pemasok belum menandai barang ini dikirim. Tunggu sampai statusnya berubah menjadi dalam pengiriman.',
        });
    }

    const hasil = await escrow.lepaskanDana(item.id, {
        alasan: escrow.ALASAN.UMKM,
        catatan: parsed.data.catatan || null,
        olehUserId: req.user.id,
    });

    res.json({
        diterima: true,
        fulfillmentStatus: 'diterima',
        receivedAt: hasil.item.receivedAt,
        danaDilepas: hasil.jumlahTransaksi,
        pesan: 'Terima kasih. Dana pemasok sekarang siap diteruskan oleh admin.',
    });
}

// ---------- POST /api/procurement/items/:itemId/komplain ----------

const komplainSchema = z.object({
    alasan: z.string().min(10, 'Ceritakan masalahnya minimal 10 karakter').max(500),
});

/**
 * UMKM melaporkan masalah: barang kurang, rusak, atau tidak sampai.
 *
 * Efeknya satu dan penting — hitungan mundur otomatis dihentikan, jadi
 * dana tidak akan lepas dengan sendirinya selagi masalahnya dibahas.
 */
async function ajukanKomplain(req, res) {
    const parsed = komplainSchema.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const item = await itemMilikUmkm(req, res);
    if (!item) return;

    if (item.fulfillmentStatus === 'diterima') {
        return res.status(400).json({
            error: 'Pesanan ini sudah dikonfirmasi diterima, komplain tidak bisa diajukan lagi',
        });
    }

    if (item.fulfillmentStatus !== 'dikirim' && item.fulfillmentStatus !== 'komplain') {
        return res.status(400).json({ error: 'Komplain baru bisa diajukan setelah barang ditandai dikirim' });
    }

    const diperbarui = await prisma.procurementOrderItem.update({
        where: { id: item.id },
        data: {
            fulfillmentStatus: 'komplain',
            complaintAt: new Date(),
            complaintNote: parsed.data.alasan,
            // Dana berhenti menghitung mundur sampai masalahnya selesai
            autoConfirmAt: null,
        },
    });

    res.json({
        fulfillmentStatus: diperbarui.fulfillmentStatus,
        complaintAt: diperbarui.complaintAt,
        pesan: 'Komplain tercatat. Dana pemasok ditahan sampai masalah ini diselesaikan admin.',
    });
}

// ---------- POST /api/admin/escrow/:itemId/lepas ----------

const lepasPaksaSchema = z.object({
    alasan: z.string().min(10, 'Alasan pelepasan wajib diisi minimal 10 karakter').max(500),
});

/**
 * Jalan keluar untuk kasus buntu: UMKM tidak bisa dihubungi, atau
 * komplainnya sudah diselesaikan di luar sistem.
 *
 * Alasannya wajib dan ikut tersimpan bersama identitas admin yang
 * menekannya, supaya jalan pintas ini tetap bisa diaudit dan tidak
 * berubah jadi kebiasaan.
 */
async function lepasPaksa(req, res) {
    const parsed = lepasPaksaSchema.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const item = await prisma.procurementOrderItem.findUnique({
        where: { id: req.params.itemId },
        include: { umkm: true, order: { include: { product: true } } },
    });

    if (!item) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

    if (item.status !== 'paid') {
        return res.status(400).json({ error: 'Pesanan ini belum lunas, tidak ada dana yang bisa dilepas' });
    }

    if (item.fulfillmentStatus === 'diterima') {
        return res.status(400).json({ error: 'Dana pesanan ini sudah dilepas sebelumnya' });
    }

    const hasil = await escrow.lepaskanDana(item.id, {
        alasan: escrow.ALASAN.ADMIN,
        catatan: parsed.data.alasan,
        olehUserId: req.user.id,
    });

    res.json({
        dilepas: true,
        danaDilepas: hasil.jumlahTransaksi,
        umkm: item.umkm.businessName,
        produk: item.order.product.name,
    });
}

// ---------- GET /api/admin/escrow ----------

/**
 * Daftar dana yang sedang ditahan, buat halaman admin. Dipisah dari
 * rekap payout karena yang dilihat di sini bukan "siapa harus dibayar",
 * melainkan "kenapa ini belum bisa dibayar".
 */
async function daftarDitahan(req, res) {
    // Bersihkan dulu yang sudah jatuh tempo, supaya daftarnya jujur
    await escrow.jalankanAutoKonfirmasi();

    const transaksi = await prisma.transaction.findMany({
        where: {
            status: 'success',
            payoutStatus: 'pending',
            escrowReleasedAt: null,
        },
        select: {
            id: true,
            amount: true,
            supplierPayout: true,
            createdAt: true,
            orderItem: {
                select: {
                    id: true,
                    quantity: true,
                    fulfillmentStatus: true,
                    shippedAt: true,
                    autoConfirmAt: true,
                    complaintAt: true,
                    complaintNote: true,
                    umkm: { select: { businessName: true, city: true } },
                    order: {
                        select: {
                            product: {
                                select: {
                                    name: true,
                                    unit: true,
                                    supplier: { select: { id: true, groupName: true } },
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const daftar = transaksi.map((t) => {
        const it = t.orderItem;
        return {
            transactionId: t.id,
            itemId: it.id,
            amount: Number(t.amount),
            supplierPayout: Number(t.supplierPayout),
            quantity: Number(it.quantity),
            fulfillmentStatus: it.fulfillmentStatus,
            statusLabel: escrow.LABEL_FULFILLMENT[it.fulfillmentStatus],
            shippedAt: it.shippedAt,
            autoConfirmAt: it.autoConfirmAt,
            sisaJam: escrow.sisaJamKonfirmasi(it.autoConfirmAt),
            complaintAt: it.complaintAt,
            complaintNote: it.complaintNote,
            dibayarPada: t.createdAt,
            umkm: it.umkm,
            supplier: it.order.product.supplier,
            product: { name: it.order.product.name, unit: it.order.product.unit },
        };
    });

    res.json({
        batasKonfirmasiHari: escrow.HARI_AUTO_KONFIRMASI,
        ringkasan: {
            jumlahPesanan: daftar.length,
            totalDitahan: daftar.reduce((s, d) => s + d.supplierPayout, 0),
            belumDikirim: daftar.filter((d) => d.fulfillmentStatus === 'menunggu').length,
            dalamPengiriman: daftar.filter((d) => d.fulfillmentStatus === 'dikirim').length,
            komplain: daftar.filter((d) => d.fulfillmentStatus === 'komplain').length,
        },
        pesanan: daftar,
    });
}

module.exports = {
    tandaiDikirim,
    konfirmasiDiterima,
    ajukanKomplain,
    lepasPaksa,
    daftarDitahan,
};
