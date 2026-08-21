const prisma = require('../utils/prisma');

/**
 * Panduan langkah pertama.
 *
 * Pengguna baru menghadapi dashboard kosong dan sering tidak tahu
 * harus mulai dari mana. Daftar ini memandu sampai mereka merasakan
 * manfaat pertama platform — bagi UMKM sampai bergabung ke belanja
 * kolektif, bagi pemasok sampai pesanan pertama dibuka.
 *
 * Status dihitung dari data nyata, bukan disimpan, supaya tidak
 * pernah salah sinkron.
 */

async function langkahUmkm(umkmId) {
    const [penjualan, prediksi, gabung, lunas] = await Promise.all([
        prisma.salesRecord.count({ where: { umkmId } }),
        prisma.forecastResult.count({ where: { umkmId } }),
        prisma.procurementOrderItem.count({ where: { umkmId } }),
        prisma.transaction.count({
            where: { status: 'success', orderItem: { umkmId } },
        }),
    ]);

    return [
        {
            kode: 'penjualan',
            judul: 'Catat penjualan harian',
            pesan: 'Semakin lengkap riwayatnya, semakin akurat prediksi kebutuhan bahan baku.',
            selesai: penjualan > 0,
            tautan: '/dashboard/sales',
            aksi: 'Catat sekarang',
            jumlah: penjualan,
        },
        {
            kode: 'prediksi',
            judul: 'Buat prediksi pertama',
            pesan: 'Sistem menghitung perkiraan kebutuhan bulan depan dari riwayat penjualanmu.',
            selesai: prediksi > 0,
            tautan: '/dashboard/forecast',
            aksi: 'Buat prediksi',
            jumlah: prediksi,
        },
        {
            kode: 'kolektif',
            judul: 'Gabung belanja kolektif',
            pesan: 'Beli bareng UMKM lain supaya kuota grosir tercapai dan harganya turun.',
            selesai: gabung > 0,
            tautan: '/dashboard/procurement',
            aksi: 'Lihat pesanan',
            jumlah: gabung,
        },
        {
            kode: 'bayar',
            judul: 'Selesaikan pembayaran',
            pesan: 'Setelah lunas, pesanan diproses pemasok dan penghematanmu mulai tercatat.',
            selesai: lunas > 0,
            tautan: '/dashboard/transactions',
            aksi: 'Lihat transaksi',
            jumlah: lunas,
        },
    ];
}

async function langkahSupplier(supplierId, profil) {
    const [produk, pesanan, terkirim] = await Promise.all([
        prisma.product.count({ where: { supplierId } }),
        prisma.procurementOrder.count({ where: { product: { supplierId } } }),
        prisma.procurementOrder.count({
            where: { status: 'delivered', product: { supplierId } },
        }),
    ]);

    return [
        {
            kode: 'rekening',
            judul: 'Isi rekening penerimaan',
            pesan: 'Dana hasil penjualan diteruskan platform ke rekening ini setelah dipotong komisi.',
            selesai: Boolean(profil?.bankName && profil?.bankAccountNumber),
            tautan: '/dashboard/profile',
            aksi: 'Isi rekening',
            jumlah: 0,
        },
        {
            kode: 'produk',
            judul: 'Tambah produk ke katalog',
            pesan: 'Cantumkan harga grosir supaya UMKM terdorong membeli bersama dalam jumlah besar.',
            selesai: produk > 0,
            tautan: '/dashboard/products',
            aksi: 'Tambah produk',
            jumlah: produk,
        },
        {
            kode: 'pesanan',
            judul: 'Buka pesanan kolektif',
            pesan: 'Kumpulkan permintaan beberapa UMKM sekaligus, lalu kirim dalam satu pengiriman.',
            selesai: pesanan > 0,
            tautan: '/dashboard/orders',
            aksi: 'Buka pesanan',
            jumlah: pesanan,
        },
        {
            kode: 'kirim',
            judul: 'Selesaikan pengiriman pertama',
            pesan: 'Tutup pesanan setelah kuota terkumpul, lalu tandai sudah dikirim.',
            selesai: terkirim > 0,
            tautan: '/dashboard/orders',
            aksi: 'Kelola pesanan',
            jumlah: terkirim,
        },
    ];
}

async function getOnboarding(req, res) {
    let langkah = [];

    if (req.user.role === 'umkm') {
        const profil = await prisma.umkmProfile.findUnique({ where: { userId: req.user.id } });
        if (profil) langkah = await langkahUmkm(profil.id);
    } else if (req.user.role === 'supplier') {
        const profil = await prisma.supplierProfile.findUnique({ where: { userId: req.user.id } });
        if (profil) langkah = await langkahSupplier(profil.id, profil);
    }

    const selesai = langkah.filter((l) => l.selesai).length;

    res.json({
        berlaku: langkah.length > 0,
        total: langkah.length,
        selesai,
        tuntas: langkah.length > 0 && selesai === langkah.length,
        langkah,
    });
}

module.exports = { getOnboarding };