const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PASSWORD_AKUN_BARU = 'Demo12345!';
const KOMISI = Number(process.env.PLATFORM_COMMISSION_RATE ?? 0.02);

// ============================================================
// Definisi mitra
// ============================================================

const SUPPLIERS = [
    {
        email: 'makmur@supplier.com',
        name: 'Bapak Sudirman',
        groupName: 'Kelompok Tani Makmur',
        city: 'Lhokseumawe',
        address: 'Desa Blang Panyang, Lhokseumawe',
        phone: '081111111111',
        products: [
            { name: 'Cabai Merah', category: 'Sayuran', unit: 'kg', price: 35000, stock: 400, bulkPrice: 29000, bulkMinQty: 60 },
            { name: 'Bawang Merah', category: 'Bumbu Dapur', unit: 'kg', price: 28000, stock: 350, bulkPrice: 24000, bulkMinQty: 50 },
            { name: 'Tomat', category: 'Sayuran', unit: 'kg', price: 22000, stock: 300, bulkPrice: 18500, bulkMinQty: 80 },
        ],
    },
    {
        email: 'sembako@supplier.com',
        name: 'Ibu Rosnani',
        groupName: 'Distributor Sembako Aceh',
        city: 'Lhokseumawe',
        address: 'Jl. Merdeka No. 12, Lhokseumawe',
        phone: '082222222222',
        products: [
            { name: 'Cabai Merah', category: 'Sayuran', unit: 'kg', price: 32000, stock: 250, bulkPrice: 28000, bulkMinQty: 80 },
            { name: 'Minyak Goreng', category: 'Sembako', unit: 'liter', price: 18000, stock: 500, bulkPrice: 16000, bulkMinQty: 100 },
            { name: 'Gula Pasir', category: 'Sembako', unit: 'kg', price: 16000, stock: 400, bulkPrice: 14500, bulkMinQty: 100 },
        ],
    },
    {
        email: 'jaya@supplier.com',
        name: 'Bapak Iskandar',
        groupName: 'Tani Jaya',
        city: 'Bireuen',
        address: 'Desa Cot Gapu, Bireuen',
        phone: '083333333333',
        products: [
            { name: 'Bawang Merah', category: 'Bumbu Dapur', unit: 'kg', price: 26500, stock: 300, bulkPrice: 23000, bulkMinQty: 60 },
            { name: 'Tomat', category: 'Sayuran', unit: 'kg', price: 25000, stock: 200, bulkPrice: 21000, bulkMinQty: 50 },
            { name: 'Kentang', category: 'Sayuran', unit: 'kg', price: 19000, stock: 250, bulkPrice: 16500, bulkMinQty: 70 },
        ],
    },
];

const UMKMS = [
    {
        email: 'muthiahrmh@gmail.com',
        name: 'Muthiah Rahma Pasaribu',
        businessName: "Mutek's Cathering",
        businessType: 'Katering',
        city: 'Lhokseumawe',
        address: 'Jl. Samudera No. 8, Lhokseumawe',
        phone: '085111222333',
        skala: 1.0,
        bahan: ['Cabai Merah', 'Bawang Merah', 'Minyak Goreng'],
    },
    {
        email: 'livia123@gmail.com',
        name: 'Livia Safirani',
        businessName: 'Warung Bude',
        businessType: 'Warung',
        city: 'Lhokseumawe',
        address: 'Buketrata, Lhokseumawe',
        phone: '082121212111',
        skala: 0.7,
        bahan: ['Cabai Merah', 'Tomat', 'Minyak Goreng'],
    },
    {
        email: 'kopisenja@umkm.com', // akun baru
        name: 'Adha Gusti',
        businessName: 'Kopi Senja',
        businessType: 'Kafe',
        city: 'Lhokseumawe',
        address: 'Jl. Darussalam No. 3, Lhokseumawe',
        phone: '087888999000',
        skala: 0.5,
        bahan: ['Gula Pasir', 'Tomat'],
    },
];

// ============================================================
// Pola penjualan bulanan
// ============================================================

/**
 * Faktor musiman per bulan untuk UMKM kuliner Indonesia.
 * Puncaknya Ramadan-Lebaran dan akhir tahun.
 */
const MUSIM = {
    1: 0.95, 2: 1.05, 3: 1.35, 4: 1.20, 5: 0.90, 6: 1.00,
    7: 1.05, 8: 1.00, 9: 0.95, 10: 1.00, 11: 1.05, 12: 1.25,
};

const BASE = {
    'Cabai Merah': 40,
    'Bawang Merah': 30,
    'Minyak Goreng': 25,
    Tomat: 35,
    'Gula Pasir': 20,
    Kentang: 22,
};

/** Acak yang stabil, supaya hasil seed selalu sama tiap dijalankan */
function acak(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

/** 24 bulan terakhir sampai bulan lalu */
function daftarBulan(jumlah = 24) {
    const hasil = [];
    const now = new Date();
    for (let i = jumlah; i >= 1; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        hasil.push({ tahun: d.getFullYear(), bulan: d.getMonth() + 1 });
    }
    return hasil;
}

// ============================================================
// Pembuatan data
// ============================================================

async function upsertSupplier(s, passwordHash) {
    let user = await prisma.user.findUnique({
        where: { email: s.email },
        include: { supplierProfile: true },
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                name: s.name,
                email: s.email,
                passwordHash,
                role: 'supplier',
                phone: s.phone,
                supplierProfile: {
                    create: { groupName: s.groupName, city: s.city, address: s.address },
                },
            },
            include: { supplierProfile: true },
        });
        console.log(`  + supplier ${s.groupName}`);
    } else if (!user.supplierProfile) {
        // Akun ada tapi profilnya belum, misalnya hasil seed manual sebelumnya
        await prisma.supplierProfile.create({
            data: { userId: user.id, groupName: s.groupName, city: s.city, address: s.address },
        });
        user = await prisma.user.findUnique({
            where: { id: user.id },
            include: { supplierProfile: true },
        });
        console.log(`  ~ profil supplier ${s.groupName} dibuat`);
    } else {
        console.log(`  = supplier ${s.groupName} sudah ada`);
    }

    const profile = user.supplierProfile;

    for (const p of s.products) {
        const existing = await prisma.product.findFirst({
            where: { supplierId: profile.id, name: p.name },
        });

        if (existing) {
            // Pastikan harga grosirnya terisi supaya demo belanja kolektif jalan
            await prisma.product.update({
                where: { id: existing.id },
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
            await prisma.product.create({
                data: { ...p, supplierId: profile.id },
            });
        }
    }

    return profile;
}

async function upsertUmkm(u, passwordHash) {
    let user = await prisma.user.findUnique({
        where: { email: u.email },
        include: { umkmProfile: true },
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                name: u.name,
                email: u.email,
                passwordHash,
                role: 'umkm',
                phone: u.phone,
                umkmProfile: {
                    create: {
                        businessName: u.businessName,
                        businessType: u.businessType,
                        city: u.city,
                        address: u.address,
                    },
                },
            },
            include: { umkmProfile: true },
        });
        console.log(`  + UMKM ${u.businessName}`);
    } else if (!user.umkmProfile) {
        await prisma.umkmProfile.create({
            data: {
                userId: user.id,
                businessName: u.businessName,
                businessType: u.businessType,
                city: u.city,
                address: u.address,
            },
        });
        user = await prisma.user.findUnique({
            where: { id: user.id },
            include: { umkmProfile: true },
        });
        console.log(`  ~ profil UMKM ${u.businessName} dibuat`);
    } else {
        console.log(`  = UMKM ${u.businessName} sudah ada`);
    }

    return user.umkmProfile;
}

async function seedPenjualan(umkmProfile, u) {
    const bulanList = daftarBulan(24);

    for (const bahan of u.bahan) {
        const sudahAda = await prisma.salesRecord.count({
            where: { umkmId: umkmProfile.id, productName: bahan },
        });

        if (sudahAda >= 48) {
            console.log(`  = riwayat ${bahan} sudah lengkap (${sudahAda} catatan)`);
            continue;
        }

        const base = (BASE[bahan] ?? 25) * u.skala;
        const data = [];

        bulanList.forEach((b, idx) => {
            const musim = MUSIM[b.bulan] ?? 1;
            // Tren tumbuh pelan, sekitar 1,5% per bulan
            const tren = 1 + idx * 0.015;
            const noise = 0.9 + acak(idx + bahan.length * 7) * 0.2;
            const totalBulan = base * musim * tren * noise;

            // Pecah jadi dua catatan per bulan, biar terlihat seperti input berkala
            const bagian = [0.55, 0.45];
            bagian.forEach((porsi, i) => {
                data.push({
                    umkmId: umkmProfile.id,
                    productName: bahan,
                    quantity: Math.max(1, Math.round(totalBulan * porsi * 10) / 10),
                    date: new Date(Date.UTC(b.tahun, b.bulan - 1, i === 0 ? 8 : 22)),
                });
            });
        });

        await prisma.salesRecord.createMany({ data });
        console.log(`  + ${data.length} catatan penjualan ${bahan}`);
    }
}

/**
 * Satu pesanan kolektif yang sudah tuntas: beberapa UMKM bergabung,
 * kuota grosir tercapai, semua sudah bayar, barang terkirim.
 */
async function seedPesananSelesai(produk, pesertaList, hariLalu) {
    const sudahAda = await prisma.procurementOrder.findFirst({
        where: { productId: produk.id, status: 'delivered' },
    });
    if (sudahAda) {
        console.log('  = pesanan kolektif selesai sudah ada');
        return;
    }

    const dibuat = new Date();
    dibuat.setDate(dibuat.getDate() - hariLalu);

    const deadline = new Date(dibuat);
    deadline.setDate(deadline.getDate() + 7);

    const totalQty = pesertaList.reduce((s, p) => s + p.qty, 0);

    const order = await prisma.procurementOrder.create({
        data: {
            productId: produk.id,
            totalQuantity: totalQty,
            status: 'delivered',
            deadline,
            createdAt: dibuat,
        },
    });

    // Harga grosir berlaku kalau kuota tercapai
    const grosirAktif =
        produk.bulkPrice != null &&
        produk.bulkMinQty != null &&
        totalQty >= Number(produk.bulkMinQty);
    const hargaBerlaku = grosirAktif ? Number(produk.bulkPrice) : Number(produk.price);

    for (const p of pesertaList) {
        const item = await prisma.procurementOrderItem.create({
            data: {
                orderId: order.id,
                umkmId: p.umkmId,
                quantity: p.qty,
                status: 'paid',
            },
        });

        const amount = Math.round(p.qty * hargaBerlaku);
        const platformFee = Math.round(amount * KOMISI * 100) / 100;

        const bayar = new Date(dibuat);
        bayar.setDate(bayar.getDate() + 2);

        await prisma.transaction.create({
            data: {
                orderItemId: item.id,
                amount,
                status: 'success',
                platformFee,
                commissionRate: KOMISI,
                supplierPayout: Math.round((amount - platformFee) * 100) / 100,
                createdAt: bayar,
            },
        });
    }

    console.log(
        `  + pesanan kolektif ${produk.name} selesai: ${totalQty} ${produk.unit}, ` +
        `${pesertaList.length} UMKM, harga ${grosirAktif ? 'grosir' : 'normal'}`
    );
}

/** Pesanan yang masih terbuka, sebagian sudah mendekati kuota grosir */
async function seedPesananTerbuka(produk, pesertaList) {
    const sudahAda = await prisma.procurementOrder.findFirst({
        where: { productId: produk.id, status: 'open' },
    });
    if (sudahAda) {
        console.log(`  = pesanan terbuka ${produk.name} sudah ada`);
        return;
    }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 6);

    const totalQty = pesertaList.reduce((s, p) => s + p.qty, 0);

    const order = await prisma.procurementOrder.create({
        data: {
            productId: produk.id,
            totalQuantity: totalQty,
            status: 'open',
            deadline,
        },
    });

    for (const p of pesertaList) {
        await prisma.procurementOrderItem.create({
            data: {
                orderId: order.id,
                umkmId: p.umkmId,
                quantity: p.qty,
                status: 'pending',
            },
        });
    }

    const sisa = Number(produk.bulkMinQty ?? 0) - totalQty;
    console.log(
        `  + pesanan terbuka ${produk.name}: ${totalQty} ${produk.unit}` +
        (sisa > 0 ? ` (kurang ${sisa} ${produk.unit} menuju grosir)` : ' (grosir aktif)')
    );
}

// ============================================================
// Alur utama
// ============================================================

async function main() {
    console.log('\nMenyiapkan data demo PanganKreatif...\n');

    const passwordHash = await bcrypt.hash(PASSWORD_AKUN_BARU, 10);

    console.log('Mitra pemasok:');
    const supplierProfiles = {};
    for (const s of SUPPLIERS) {
        supplierProfiles[s.groupName] = await upsertSupplier(s, passwordHash);
    }

    console.log('\nUMKM kuliner:');
    const umkmProfiles = {};
    for (const u of UMKMS) {
        umkmProfiles[u.businessName] = await upsertUmkm(u, passwordHash);
    }

    console.log('\nRiwayat penjualan (24 bulan):');
    for (const u of UMKMS) {
        await seedPenjualan(umkmProfiles[u.businessName], u);
    }

    console.log('\nPesanan kolektif:');

    const makmur = supplierProfiles['Kelompok Tani Makmur'];
    const cabaiMakmur = await prisma.product.findFirst({
        where: { supplierId: makmur.id, name: 'Cabai Merah' },
    });
    const bawangMakmur = await prisma.product.findFirst({
        where: { supplierId: makmur.id, name: 'Bawang Merah' },
    });

    // Sudah selesai: kuota grosir tercapai, semua lunas, barang terkirim
    await seedPesananSelesai(
        cabaiMakmur,
        [
            { umkmId: umkmProfiles["Mutek's Cathering"].id, qty: 30 },
            { umkmId: umkmProfiles['Warung Bude'].id, qty: 22 },
            { umkmId: umkmProfiles['Kopi Senja'].id, qty: 10 },
        ],
        14
    );

    // Masih terbuka: sengaja kurang sedikit dari kuota grosir,
    // supaya progress bar "kurang sekian lagi" terlihat saat demo
    await seedPesananTerbuka(bawangMakmur, [
        { umkmId: umkmProfiles["Mutek's Cathering"].id, qty: 25 },
        { umkmId: umkmProfiles['Warung Bude'].id, qty: 12 },
    ]);

    console.log('\nSelesai.\n');
    console.log('Akun yang sudah ada -> password lama tetap berlaku:');
    console.log('  makmur@supplier.com, sembako@supplier.com, jaya@supplier.com');
    console.log('  livia123@gmail.com, muthiahrmh@gmail.com');
    console.log(`\nAkun baru yang dibuat skrip ini -> password: ${PASSWORD_AKUN_BARU}`);
    console.log('  kopisenja@umkm.com (Kopi Senja)');
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