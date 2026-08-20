import { api } from "@/lib/api";
import { toNumber } from "@/lib/format";
import type {
    DemandInsights,
    OrderStatus,
    ProductPayload,
    SupplierOrder,
    SupplierProduct,
    SupplierStats,
} from "@/types/supplier";

export async function fetchSupplierStats() {
    const res = await api.get<SupplierStats>("/supplier/stats");
    return res.data;
}

export async function fetchDemandInsights(params?: { days?: number; city?: string }) {
    const res = await api.get<DemandInsights>("/supplier/demand", { params });
    return res.data;
}

export async function fetchMyProducts() {
    const res = await api.get<SupplierProduct[]>("/supplier/products");
    return res.data;
}

export async function createProduct(payload: ProductPayload) {
    // Backend pakai zod: price & stock wajib number, bukan string dari input form
    const res = await api.post<SupplierProduct>("/products", {
        ...payload,
        price: toNumber(payload.price),
        stock: Math.trunc(toNumber(payload.stock)),
    });
    return res.data;
}

export async function updateProduct(id: string, payload: ProductPayload) {
    const res = await api.put<SupplierProduct>(`/products/${id}`, {
        ...payload,
        price: toNumber(payload.price),
        stock: Math.trunc(toNumber(payload.stock)),
    });
    return res.data;
}

export async function deleteProduct(id: string) {
    await api.delete(`/products/${id}`);
}

export async function fetchMyOrders(status?: OrderStatus) {
    const res = await api.get<SupplierOrder[]>("/supplier/orders", {
        params: status ? { status } : undefined,
    });
    return res.data;
}

export async function createOrder(productId: string, deadline: string) {
    const res = await api.post("/procurement/orders", {
        productId,
        deadline: new Date(deadline).toISOString(),
    });
    return res.data;
}

export async function closeOrder(id: string) {
    const res = await api.patch(`/procurement/orders/${id}/close`);
    return res.data;
}

export async function deliverOrder(id: string) {
    const res = await api.patch(`/procurement/orders/${id}/deliver`);
    return res.data;
}

export async function updateTransactionStatus(
    id: string,
    status: "success" | "failed"
) {
    const res = await api.patch(`/procurement/transactions/${id}/status`, { status });
    return res.data;
}