import type { JejakFulfillment } from "@/types/fulfillment";

export type OrderStatus = "open" | "closed" | "delivered";
export type ItemStatus = "pending" | "paid";
export type TransactionStatus = "pending" | "success" | "failed";

export interface LowStockItem {
    id: string;
    name: string;
    stock: number;
    unit: string;
}

export interface SupplierStats {
    totalProducts: number;
    openOrders: number;
    deliveredOrders: number;
    umkmReached: number;
    volumeThisMonth: number;
    revenueThisMonth: number;
    needsAction: number;
    lowStock: LowStockItem[];
}

export interface SupplierProduct {
    id: string;
    supplierId: string;
    name: string;
    category: string;
    unit: string;
    price: number;
    stock: number;
    bulkPrice: number | null;
    bulkMinQty: number | null;
    hasBulk: boolean;
    orderCount: number;
}

export interface OrderProduct {
    id: string;
    supplierId: string;
    name: string;
    category: string;
    unit: string;

    price: number;
    normalPrice: number;
    bulkPrice: number | null;
    bulkMinQty: number | null;
    stock: number;
}

export interface BulkPricing {
    unitPrice: number;
    normalPrice: number;
    bulkPrice: number | null;
    bulkMinQty: number | null;
    isBulkActive: boolean;
    remainingToBulk: number;
    savingPerUnit: number;
}

export interface OrderParticipant {
    id: string;
    businessName: string;
    businessType: string;
    city: string;
}

export interface SupplierOrderItem extends JejakFulfillment {
    id: string;
    orderId: string;
    umkmId: string;
    quantity: number;
    status: ItemStatus;
    subtotal: number;
    umkm: OrderParticipant;
    transactions: {
        id: string;
        amount: number;
        status: TransactionStatus;
        createdAt: string;
    }[];
}

export interface SupplierOrder {
    id: string;
    productId: string;
    totalQuantity: number;
    status: OrderStatus;
    deadline: string;
    createdAt: string;
    product: OrderProduct;
    items: SupplierOrderItem[];
    participantCount: number;
    estimatedValue: number;
    isExpired: boolean;
    pricing: BulkPricing;
}

export interface DemandCommodity {
    name: string;
    category: string;
    unit: string;
    totalQuantity: number;
    requestCount: number;
    umkmCount: number;
    suppliedByMe: boolean;
}

export interface DemandSelling {
    name: string;
    totalQuantity: number;
    umkmCount: number;
}

export interface DemandInsights {
    periodDays: number;
    city: string | null;
    topCommodities: DemandCommodity[];
    topSelling: DemandSelling[];
    opportunities: DemandCommodity[];
}

export interface ProductPayload {
    name: string;
    category: string;
    unit: string;
    price: number;
    stock: number;
    bulkPrice?: number | null;
    bulkMinQty?: number | null;
}