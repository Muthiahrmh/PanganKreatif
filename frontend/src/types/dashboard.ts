export interface SalesRecord {
    id: string;
    productName: string;
    quantity: string;
    date: string;
}

export interface ForecastResult {
    id: string;
    productName: string;
    predictedQuantity: string;
    period: string;
    createdAt: string;
}

export interface ForecastDetail {
    forecast: ForecastResult;
    detail: {
        monthlyTotals: { periodKey: string; quantity: number }[];
        movingAverage?: number;
        linearTrend?: number;
        seasonalFactor?: number;
        seasonalityApplied?: boolean;
        monthsOfData?: number;
        lastDataPeriod?: string;
        keterangan?: string;
    };
    algoritma: string;
}

/** Status harga grosir untuk satu pesanan kolektif */
export interface BulkPricing {
    /** Harga yang berlaku sekarang — grosir kalau kuota sudah tercapai */
    unitPrice: number;
    normalPrice: number;
    bulkPrice: number | null;
    bulkMinQty: number | null;
    isBulkActive: boolean;
    /** Sisa kuantitas sampai harga grosir aktif */
    remainingToBulk: number;
    savingPerUnit: number;
}

export interface ProcurementProduct {
    id: string;
    name: string;
    unit: string;
    price: string;
    category: string;
    bulkPrice?: string | null;
    bulkMinQty?: number | null;
    supplier: { groupName: string; city: string };
}

export interface ProcurementOrder {
    id: string;
    productId: string;
    totalQuantity: string;
    status: "open" | "closed" | "delivered";
    deadline: string;
    createdAt: string;
    product: ProcurementProduct;
    items: { id: string; umkmId: string; quantity: string; status: string }[];
    pricing?: BulkPricing;
    participantCount?: number;
}

export interface RekeningPemasok {
    bank: string;
    nomor: string | null;
    atasNama: string | null;
}

export interface ProcurementOrderItem {
    id: string;
    orderId: string;
    quantity: string;
    status: "pending" | "paid";
    order: ProcurementOrder;
    pricing?: BulkPricing;
    subtotal?: number;
    /** Rekening tujuan transfer, kalau pemasok sudah mengisinya */
    rekening?: RekeningPemasok | null;
    transactions?: {
        id: string;
        amount: string;
        status: "pending" | "success" | "failed";
    }[];
}