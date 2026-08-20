export type TxStatus = "pending" | "success" | "failed";

/** Riwayat pembayaran dari sisi UMKM */
export interface UmkmTransaction {
    id: string;
    amount: number;
    platformFee: number;
    status: TxStatus;
    createdAt: string;
    paymentProofUrl: string | null;
    quantity: number;
    itemStatus: "pending" | "paid";
    orderStatus: "open" | "closed" | "delivered";
    /** Harga per unit yang benar-benar dibayar */
    unitPrice: number;
    normalPrice: number;
    isBulkActive: boolean;
    /** Rupiah yang dihemat berkat pembelian kolektif */
    saving: number;
    product: { name: string; unit: string; category: string };
    supplier: { groupName: string; city: string };
}

/** Pembayaran masuk dari sisi supplier */
export interface SupplierTransaction {
    id: string;
    amount: number;
    platformFee: number;
    supplierPayout: number;
    status: TxStatus;
    createdAt: string;
    paymentProofUrl: string | null;
    quantity: number;
    umkm: { businessName: string; city: string };
    product: { name: string; unit: string };
}

/** Semua transaksi dari sisi admin platform */
export interface AdminTransaction {
    id: string;
    amount: number;
    platformFee: number;
    supplierPayout: number;
    commissionRate: number;
    status: TxStatus;
    createdAt: string;
    quantity: number;
    umkm: { businessName: string; city: string };
    supplier: { groupName: string; city: string };
    product: { name: string; unit: string };
}

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: "umkm" | "supplier";
    createdAt: string;
    businessName: string | null;
    city: string | null;
    businessType: string | null;
}

export interface AdminStats {
    commissionRate: number;
    users: { umkm: number; supplier: number; total: number };
    catalog: { products: number };
    orders: { total: number; open: number; delivered: number; totalVolume: number };
    finance: {
        gmv: number;
        revenue: number;
        cogs: number;
        grossProfit: number;
        successCount: number;
        pendingCount: number;
        pendingValue: number;
    };
    series: { key: string; label: string; gmv: number; revenue: number; count: number }[];
    topCommodities: { name: string; unit: string; quantity: number; value: number }[];
    recentTransactions: {
        id: string;
        amount: number;
        platformFee: number;
        status: TxStatus;
        createdAt: string;
        umkm: string;
        supplier: string;
        product: string;
    }[];
}