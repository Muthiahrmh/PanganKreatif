import { api } from "@/lib/api";
import type {
    AdminStats,
    AdminTransaction,
    AdminUser,
    SupplierTransaction,
    TxStatus,
    UmkmTransaction,
} from "@/types/transaction";

export async function fetchMyTransactions() {
    const res = await api.get<UmkmTransaction[]>("/procurement/transactions/mine");
    return res.data;
}

export async function fetchSupplierTransactions() {
    const res = await api.get<SupplierTransaction[]>("/supplier/transactions");
    return res.data;
}

export async function verifyTransaction(id: string, status: "success" | "failed") {
    const res = await api.patch(`/procurement/transactions/${id}/status`, { status });
    return res.data;
}

export async function fetchAdminStats() {
    const res = await api.get<AdminStats>("/admin/stats");
    return res.data;
}

export async function fetchAdminUsers() {
    const res = await api.get<AdminUser[]>("/admin/users");
    return res.data;
}

export async function fetchAdminTransactions(status?: TxStatus) {
    const res = await api.get<AdminTransaction[]>("/admin/transactions", {
        params: status ? { status } : undefined,
    });
    return res.data;
}