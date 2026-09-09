const prisma = require('../utils/prisma');
const { resolveUnitPrice, toNum } = require('../utils/pricing');
const { sisaJamKonfirmasi, HARI_AUTO_KONFIRMASI } = require('../utils/escrow');

/**
 * Notifikasi diturunkan langsung dari keadaan data, bukan disimpan
 * di tabel tersendiri.
 *
 * Alasannya: notifikasi tersimpan mudah basi. Pesan "kurang 13 kg
 * lagi ke harga grosir" akan tetap ada meski kuotanya sudah
 * tercapai. Dengan diturunkan saat diminta, isinya selalu sesuai
 * keadaan sebenarnya dan tidak perlu pekerjaan latar.
 */

const hariLalu = (tanggal) =>
    Math.floor((Date.now() - new Date(tanggal).getTime()) / 86_400_000);

const sisaHari = (tanggal) =>
    Math.ceil((new Date(tanggal).getTime() - Date.now()) / 86_400_000);

const rupiah = (n) => 'Rp' + Math.round(toNum(n)).toLocaleString('id-ID');
const angka = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(toNum(n));

// ============================================================
// UMKM
// ============================================================

async function notifikasiUmkm(umkmId) {
    const notif = [];

    const items = await prisma.procurementOrderItem.findMany({
        where: { umkmId },
        include: {
            order: { include: { product: { include: { supplier: true } } } },
            transactions: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { id: 'desc' },
        take: 40,
    });

    for (const it of items) {
        const o = it.order;
        const harga = resolveUnitPrice(o.product, o.totalQuantity);
        const namaProduk = o.product.name;
        const satuan = o.product.unit;
        const pemasok = o.product.supplier.groupName;

        const lunas = it.status === 'paid';
        const menunggu = it.transactions.find((t) => t.status === 'pending');
        const berhasil = it.transactions.find((t) => t.status === 'success');

        // Harga grosir aktif pada pesanan yang diikuti
        if (o.status === 'open' && harga.isBulkActive && !lunas) {
            notif.push({
                id: `grosir-${it.id}`,
                tipe: 'grosir_aktif',
                tingkat: 'baik',
                judul: 'Harga grosir aktif',
                pesan: `Kuota ${namaProduk} tercapai. Harga turun jadi ${rupiah(harga.unitPrice)}/${satuan}, hemat ${rupiah(harga.savingPerUnit)} per ${satuan}.`,
                waktu: o.createdAt,
                tautan: '/dashboard/procurement',
            });
        }

        // Mendekati batas waktu tapi belum dibayar
        if (o.status === 'open' && !lunas && !menunggu) {
            const sisa = sisaHari(o.deadline);
            if (sisa >= 0 && sisa <= 3) {
                notif.push({
                    id: `deadline-${it.id}`,
                    tipe: 'deadline',
                    tingkat: 'perlu_tindakan',
                    judul: 'Segera bayar pesanan',
                    pesan: `Pesanan ${namaProduk} dari ${pemasok} ditutup ${sisa === 0 ? 'hari ini' : `${sisa} hari lagi`}. Selesaikan pembayaran supaya tidak batal.`,
                    waktu: o.deadline,
                    tautan: '/dashboard/procurement',
                });
            }
        }

        // Pembayaran menunggu konfirmasi pemasok
        if (menunggu) {
            notif.push({
                id: `verif-${menunggu.id}`,
                tipe: 'menunggu_verifikasi',
                tingkat: 'info',
                judul: 'Menunggu konfirmasi pemasok',
                pesan: `Pembayaran ${rupiah(menunggu.amount)} untuk ${namaProduk} sedang diperiksa ${pemasok}.`,
                waktu: menunggu.createdAt,
                tautan: '/dashboard/transactions',
            });
        }

        // Pembayaran dikonfirmasi
        if (berhasil && hariLalu(berhasil.createdAt) <= 14) {
            notif.push({
                id: `lunas-${berhasil.id}`,
                tipe: 'lunas',
                tingkat: 'baik',
                judul: 'Pembayaran terkonfirmasi',
                pesan: `${namaProduk} ${angka(it.quantity)} ${satuan} sudah lunas${berhasil.paymentChannel ? ` lewat ${berhasil.paymentChannel}` : ''}.`,
                waktu: berhasil.createdAt,
                tautan: '/dashboard/transactions',
            });
        }

        // Barang sudah berangkat — UMKM perlu mengonfirmasi supaya dana
        // pemasok bisa dilepas. Ini notifikasi terpenting di alur baru,
        // jadi tingkatnya sengaja "perlu_tindakan", bukan sekadar kabar.
        if (it.fulfillmentStatus === 'dikirim') {
            const sisa = sisaJamKonfirmasi(it.autoConfirmAt);
            const kapan =
                sisa == null
                    ? ''
                    : sisa < 24
                        ? ` Kalau tidak dikonfirmasi, otomatis selesai dalam ${sisa} jam.`
                        : ` Kalau tidak dikonfirmasi, otomatis selesai ${Math.ceil(sisa / 24)} hari lagi.`;

            notif.push({
                id: `kirim-${it.id}`,
                tipe: 'perlu_konfirmasi_terima',
                tingkat: 'perlu_tindakan',
                judul: 'Konfirmasi barang diterima',
                pesan: `${pemasok} sudah mengirim ${namaProduk} ${angka(it.quantity)} ${satuan}. Periksa barangnya, lalu tekan "Barang Sudah Diterima".${kapan}`,
                waktu: it.shippedAt ?? o.createdAt,
                tautan: '/dashboard/procurement',
            });
        }

        // Komplain yang masih menggantung
        if (it.fulfillmentStatus === 'komplain') {
            notif.push({
                id: `komplain-${it.id}`,
                tipe: 'komplain_diproses',
                tingkat: 'info',
                judul: 'Komplain sedang diproses',
                pesan: `Komplain untuk ${namaProduk} dari ${pemasok} sudah tercatat. Dana ditahan platform sampai masalahnya selesai.`,
                waktu: it.complaintAt ?? o.createdAt,
                tautan: '/dashboard/procurement',
            });
        }

        // Selesai — barang diterima dan dana pemasok dilepas
        if (it.fulfillmentStatus === 'diterima' && it.receivedAt && hariLalu(it.receivedAt) <= 14) {
            notif.push({
                id: `selesai-${it.id}`,
                tipe: 'pesanan_selesai',
                tingkat: 'baik',
                judul: 'Pesanan selesai',
                pesan: `${namaProduk} ${angka(it.quantity)} ${satuan} dari ${pemasok} sudah kamu konfirmasi diterima.`,
                waktu: it.receivedAt,
                tautan: '/dashboard/transactions',
            });
        }
    }

    // Pesanan kolektif baru untuk bahan yang biasa dibeli
    const bahanBiasa = await prisma.salesRecord.findMany({
        where: { umkmId },
        select: { productName: true },
        distinct: ['productName'],
        take: 10,
    });

    const namaBahan = bahanBiasa.map((b) => b.productName);
    const sudahIkut = new Set(items.map((i) => i.orderId));

    if (namaBahan.length > 0) {
        const peluang = await prisma.procurementOrder.findMany({
            where: { status: 'open', product: { name: { in: namaBahan } } },
            include: { product: { include: { supplier: true } } },
            take: 10,
        });

        for (const o of peluang) {
            if (sudahIkut.has(o.id)) continue;
            const harga = resolveUnitPrice(o.product, o.totalQuantity);

            notif.push({
                id: `peluang-${o.id}`,
                tipe: 'peluang',
                tingkat: 'perlu_tindakan',
                judul: 'Pesanan kolektif terbuka',
                pesan: harga.bulkPrice
                    ? `${o.product.supplier.groupName} membuka pesanan ${o.product.name}. Kurang ${angka(harga.remainingToBulk)} ${o.product.unit} lagi ke harga grosir ${rupiah(harga.bulkPrice)}.`
                    : `${o.product.supplier.groupName} membuka pesanan ${o.product.name} seharga ${rupiah(harga.unitPrice)}/${o.product.unit}.`,
                waktu: o.createdAt,
                tautan: '/dashboard/procurement',
            });
        }
    }

    return notif;
}

// ============================================================
// Pemasok
// ============================================================

async function notifikasiSupplier(supplierId) {
    const notif = [];

    const orders = await prisma.procurementOrder.findMany({
        where: { product: { supplierId } },
        include: {
            product: true,
            items: {
                include: {
                    umkm: { select: { businessName: true } },
                    transactions: { orderBy: { createdAt: 'desc' } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
    });

    for (const o of orders) {
        const harga = resolveUnitPrice(o.product, o.totalQuantity);

        for (const it of o.items) {
            const menunggu = it.transactions.find((t) => t.status === 'pending');
            if (menunggu) {
                notif.push({
                    id: `konfirmasi-${menunggu.id}`,
                    tipe: 'perlu_konfirmasi',
                    tingkat: 'perlu_tindakan',
                    judul: 'Pembayaran perlu dikonfirmasi',
                    pesan: `${it.umkm.businessName} membayar ${rupiah(menunggu.amount)} untuk ${o.product.name}. Periksa dan konfirmasi.`,
                    waktu: menunggu.createdAt,
                    tautan: '/dashboard/transactions',
                });
            }

            // Barang belum berangkat padahal UMKM sudah bayar
            if (it.status === 'paid' && it.fulfillmentStatus === 'menunggu') {
                notif.push({
                    id: `belum-kirim-${it.id}`,
                    tipe: 'perlu_dikirim',
                    tingkat: 'perlu_tindakan',
                    judul: 'Pesanan lunas menunggu dikirim',
                    pesan: `${it.umkm.businessName} sudah melunasi ${o.product.name}. Kirim barangnya lalu tandai "Dikirim" — dana baru cair setelah UMKM mengonfirmasi penerimaan.`,
                    waktu: o.createdAt,
                    tautan: '/dashboard/orders',
                });
            }

            // Sudah dikirim, dananya menunggu konfirmasi UMKM
            if (it.fulfillmentStatus === 'dikirim') {
                const sisa = sisaJamKonfirmasi(it.autoConfirmAt);
                notif.push({
                    id: `tahan-${it.id}`,
                    tipe: 'dana_ditahan',
                    tingkat: 'info',
                    judul: 'Dana menunggu konfirmasi UMKM',
                    pesan: `${it.umkm.businessName} belum menekan "Barang Sudah Diterima" untuk ${o.product.name}. Dana dilepas otomatis ${sisa != null && sisa < 24 ? `dalam ${sisa} jam` : `${HARI_AUTO_KONFIRMASI} hari setelah pengiriman`}.`,
                    waktu: it.shippedAt ?? o.createdAt,
                    tautan: '/dashboard/transactions',
                });
            }

            const sukses = it.transactions.find((t) => t.status === 'success');
            if (sukses && sukses.payoutStatus === 'paid' && hariLalu(sukses.payoutAt ?? sukses.createdAt) <= 14) {
                notif.push({
                    id: `payout-${sukses.id}`,
                    tipe: 'dana_diteruskan',
                    tingkat: 'baik',
                    judul: 'Dana diteruskan platform',
                    pesan: `${rupiah(sukses.supplierPayout)} dari penjualan ${o.product.name} sudah ditransfer ke rekening kamu.`,
                    waktu: sukses.payoutAt ?? sukses.createdAt,
                    tautan: '/dashboard/transactions',
                });
            }
        }

        // Lewat batas waktu tapi masih terbuka
        if (o.status === 'open' && sisaHari(o.deadline) < 0) {
            notif.push({
                id: `lewat-${o.id}`,
                tipe: 'lewat_deadline',
                tingkat: 'perlu_tindakan',
                judul: 'Pesanan lewat batas waktu',
                pesan: `Pesanan ${o.product.name} sudah lewat ${Math.abs(sisaHari(o.deadline))} hari. Tutup supaya bisa lanjut ke pengiriman.`,
                waktu: o.deadline,
                tautan: '/dashboard/orders',
            });
        }

        // Kuota grosir tercapai
        if (o.status === 'open' && harga.isBulkActive) {
            notif.push({
                id: `kuota-${o.id}`,
                tipe: 'kuota_tercapai',
                tingkat: 'baik',
                judul: 'Kuota grosir tercapai',
                pesan: `Pesanan ${o.product.name} sudah mencapai ${angka(o.totalQuantity)} ${o.product.unit} dari ${o.items.length} UMKM.`,
                waktu: o.createdAt,
                tautan: '/dashboard/orders',
            });
        }
    }

    // Stok menipis
    const stokTipis = await prisma.product.findMany({
        where: { supplierId, stock: { lte: 10 } },
        select: { id: true, name: true, stock: true, unit: true },
        take: 10,
    });

    for (const p of stokTipis) {
        notif.push({
            id: `stok-${p.id}`,
            tipe: 'stok_menipis',
            tingkat: 'perlu_tindakan',
            judul: 'Stok menipis',
            pesan: `${p.name} tinggal ${angka(p.stock)} ${p.unit}. Perbarui stok supaya pesanan tidak tertolak.`,
            waktu: new Date(),
            tautan: '/dashboard/products',
        });
    }

    return notif;
}

// ============================================================
// Admin
// ============================================================

async function notifikasiAdmin() {
    const notif = [];

    // Hanya yang barangnya sudah dikonfirmasi diterima. Dana yang masih
    // ditahan punya notifikasinya sendiri di bawah — kalau digabung,
    // admin akan dikabari "ada yang perlu diteruskan" untuk uang yang
    // justru sedang sengaja dikunci.
    const tertunda = await prisma.transaction.findMany({
        where: { status: 'success', payoutStatus: 'pending', escrowReleasedAt: { not: null } },
        select: {
            supplierPayout: true,
            createdAt: true,
            orderItem: {
                select: {
                    order: {
                        select: {
                            product: {
                                select: { supplier: { select: { id: true, groupName: true, bankName: true } } },
                            },
                        },
                    },
                },
            },
        },
    });

    const perPemasok = new Map();
    for (const t of tertunda) {
        const sup = t.orderItem?.order?.product?.supplier;
        if (!sup) continue;
        const e = perPemasok.get(sup.id) || { nama: sup.groupName, bank: sup.bankName, total: 0, n: 0, tertua: t.createdAt };
        e.total += toNum(t.supplierPayout);
        e.n += 1;
        if (t.createdAt < e.tertua) e.tertua = t.createdAt;
        perPemasok.set(sup.id, e);
    }

    const urut = [...perPemasok.values()].sort((a, b) => b.total - a.total);

    if (urut.length > 0) {
        const total = urut.reduce((s, e) => s + e.total, 0);
        notif.push({
            id: 'payout-ringkas',
            tipe: 'payout_tertunda',
            tingkat: 'perlu_tindakan',
            judul: 'Dana menunggu diteruskan',
            pesan: `${rupiah(total)} untuk ${urut.length} pemasok belum diteruskan. Terlama menunggu ${hariLalu(urut[0].tertua)} hari.`,
            waktu: urut[0].tertua,
            tautan: '/dashboard/payouts',
        });
    }

    const tanpaRekening = urut.filter((e) => !e.bank);
    if (tanpaRekening.length > 0) {
        notif.push({
            id: 'tanpa-rekening',
            tipe: 'rekening_kosong',
            tingkat: 'perlu_tindakan',
            judul: 'Pemasok belum punya rekening',
            pesan: `${tanpaRekening.length} pemasok belum mengisi rekening, dananya belum bisa dikirim.`,
            waktu: new Date(),
            tautan: '/dashboard/payouts',
        });
    }

    // Dana yang ditahan rekening bersama, dipisah menurut penyebabnya
    const [belumDikirim, komplain] = await Promise.all([
        prisma.transaction.count({
            where: {
                status: 'success',
                payoutStatus: 'pending',
                escrowReleasedAt: null,
                orderItem: { fulfillmentStatus: 'menunggu' },
            },
        }),
        prisma.transaction.count({
            where: {
                status: 'success',
                payoutStatus: 'pending',
                escrowReleasedAt: null,
                orderItem: { fulfillmentStatus: 'komplain' },
            },
        }),
    ]);

    if (komplain > 0) {
        notif.push({
            id: 'escrow-komplain',
            tipe: 'komplain_umkm',
            tingkat: 'perlu_tindakan',
            judul: 'Komplain UMKM perlu ditangani',
            pesan: `${komplain} pesanan dikomplain UMKM. Dananya ditahan sampai masalahnya selesai — selesaikan lalu lepas dananya dari halaman payout.`,
            waktu: new Date(),
            tautan: '/dashboard/payouts',
        });
    }

    if (belumDikirim > 0) {
        notif.push({
            id: 'escrow-belum-kirim',
            tipe: 'dana_ditahan',
            tingkat: 'info',
            judul: 'Dana ditahan, barang belum dikirim',
            pesan: `${belumDikirim} pesanan sudah lunas tapi pemasoknya belum menandai barang dikirim. Dananya belum bisa diteruskan.`,
            waktu: new Date(),
            tautan: '/dashboard/payouts',
        });
    }

    const menungguVerif = await prisma.transaction.count({ where: { status: 'pending' } });
    if (menungguVerif > 0) {
        notif.push({
            id: 'verif-tertunda',
            tipe: 'verifikasi_tertunda',
            tingkat: 'info',
            judul: 'Pembayaran belum terverifikasi',
            pesan: `${menungguVerif} pembayaran masih menunggu konfirmasi pemasok.`,
            waktu: new Date(),
            tautan: '/dashboard/transactions',
        });
    }

    return notif;
}

// ============================================================

async function getNotifications(req, res) {
    let notif = [];

    if (req.user.role === 'umkm') {
        const profil = await prisma.umkmProfile.findUnique({ where: { userId: req.user.id } });
        if (profil) notif = await notifikasiUmkm(profil.id);
    } else if (req.user.role === 'supplier') {
        const profil = await prisma.supplierProfile.findUnique({ where: { userId: req.user.id } });
        if (profil) notif = await notifikasiSupplier(profil.id);
    } else if (req.user.role === 'admin') {
        notif = await notifikasiAdmin();
    }

    // Yang perlu tindakan naik ke atas, sisanya urut waktu terbaru
    const bobot = { perlu_tindakan: 0, baik: 1, info: 2 };
    notif.sort((a, b) => {
        const selisih = (bobot[a.tingkat] ?? 3) - (bobot[b.tingkat] ?? 3);
        if (selisih !== 0) return selisih;
        return new Date(b.waktu).getTime() - new Date(a.waktu).getTime();
    });

    const dibatasi = notif.slice(0, 25);

    res.json({
        total: dibatasi.length,
        perluTindakan: dibatasi.filter((n) => n.tingkat === 'perlu_tindakan').length,
        notifikasi: dibatasi,
    });
}

module.exports = { getNotifications };