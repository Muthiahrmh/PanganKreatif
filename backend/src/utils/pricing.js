const COMMISSION_RATE = Number(process.env.PLATFORM_COMMISSION_RATE ?? 0.02);

const COST_PER_TRANSACTION = Number(process.env.PLATFORM_COST_PER_TRX ?? 10000);

const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

const round2 = (n) => Math.round(n * 100) / 100;

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

function splitPayment(amount) {
    const gross = toNum(amount);
    const platformFee = round2(gross * COMMISSION_RATE);
    return {
        amount: gross,
        commissionRate: COMMISSION_RATE,
        platformFee,
        supplierPayout: round2(gross - platformFee),
    };
}

module.exports = {
    COMMISSION_RATE,
    COST_PER_TRANSACTION,
    resolveUnitPrice,
    splitPayment,
    toNum,
    round2,
};