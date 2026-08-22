/**
 * Aturan bisnis PanganKreatif: komisi platform & harga grosir.
 * Dikumpulkan di satu file supaya angkanya konsisten di seluruh sistem
 * dan gampang dijelaskan ke penguji.
 */

// Komisi platform per transaksi. Bisa diubah lewat .env tanpa ubah kode.
const COMMISSION_RATE = Number(process.env.PLATFORM_COMMISSION_RATE ?? 0.02);

// Margin distribusi atas volume bahan baku yang disalurkan.
// Sumber pendapatan kedua pada Bab V, terpisah dari komisi.
const MARGIN_RATE = Number(process.env.PLATFORM_MARGIN_RATE ?? 0.017);

// Biaya komputasi & verifikasi per transaksi (HPP di Bab V proposal)
const COST_PER_TRANSACTION = Number(process.env.PLATFORM_COST_PER_TRX ?? 10000);

const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Harga per unit yang berlaku untuk sebuah pesanan kolektif.
 * Kalau total kuantitas yang terkumpul sudah mencapai ambang grosir,
 * seluruh peserta otomatis dapat harga grosir.
 */
function resolveUnitPrice(product, totalQuantity) {
    const normal = toNum(product.price);
    const bulk = product.bulkPrice == null ? null : toNum(product.bulkPrice);
    const minQty = product.bulkMinQty == null ? null : toNum(product.bulkMinQty);

    const eligible =
        bulk != null && bulk > 0 && minQty != null && minQty > 0 && toNum(totalQuantity) >= minQty;

    return {
        unitPrice: eligible ? bulk : normal,
        normalPrice: normal,
        bulkPrice: bulk,
        bulkMinQty: minQty,
        isBulkActive: eligible,
        // Berapa lagi yang dibutuhkan supaya harga grosir aktif
        remainingToBulk:
            bulk != null && minQty != null && !eligible
                ? Math.max(minQty - toNum(totalQuantity), 0)
                : 0,
        savingPerUnit: eligible ? round2(normal - bulk) : 0,
    };
}

/**
 * Pembagian uang dari satu pembayaran UMKM menjadi tiga bagian:
 *
 *   1. Komisi transaksi   — imbalan atas layanan platform
 *   2. Margin distribusi  — imbalan atas penyaluran volume
 *   3. Hak pemasok        — sisanya, diteruskan ke rekening pemasok
 *
 * Keduanya dipisah karena Tabel 5.6 proposal memang memperlakukannya
 * sebagai dua sumber pendapatan yang berbeda.
 */
function splitPayment(amount) {
    const gross = toNum(amount);
    const platformFee = round2(gross * COMMISSION_RATE);
    const distributionMargin = round2(gross * MARGIN_RATE);

    return {
        amount: gross,
        commissionRate: COMMISSION_RATE,
        marginRate: MARGIN_RATE,
        platformFee,
        distributionMargin,
        pendapatanPlatform: round2(platformFee + distributionMargin),
        supplierPayout: round2(gross - platformFee - distributionMargin),
    };
}

module.exports = {
    COMMISSION_RATE,
    MARGIN_RATE,
    COST_PER_TRANSACTION,
    resolveUnitPrice,
    splitPayment,
    toNum,
    round2,
};