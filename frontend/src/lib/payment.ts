import { api } from "@/lib/api";
import type { InfoPembayaran, SesiPembayaran, StatusResponse } from "@/types/payment";

export async function mulaiPembayaran(itemId: string) {
    const res = await api.post<SesiPembayaran>(`/payments/items/${itemId}`);
    return res.data;
}

export async function periksaStatusPembayaran(transactionId: string) {
    const res = await api.get<StatusResponse>(`/payments/${transactionId}/status`);
    return res.data;
}

export async function ambilInfoPembayaran() {
    const res = await api.get<InfoPembayaran>("/payments/info");
    return res.data;
}

export async function batalkanPembayaran(transactionId: string) {
    const res = await api.delete(`/payments/${transactionId}`);
    return res.data;
}

const ID_SKRIP = "midtrans-snap";

/**
 * Muat skrip Snap sekali saja. Client key dan alamatnya berasal
 * dari backend, supaya sandbox dan produksi tidak perlu diatur
 * di dua tempat.
 */
export function muatSnap(clientKey: string, produksi: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") return resolve();
        if (window.snap) return resolve();

        const adaSebelumnya = document.getElementById(ID_SKRIP);
        if (adaSebelumnya) {
            adaSebelumnya.addEventListener("load", () => resolve());
            adaSebelumnya.addEventListener("error", () => reject(new Error("Snap gagal dimuat")));
            return;
        }

        const el = document.createElement("script");
        el.id = ID_SKRIP;
        el.src = produksi
            ? "https://app.midtrans.com/snap/snap.js"
            : "https://app.sandbox.midtrans.com/snap/snap.js";
        el.setAttribute("data-client-key", clientKey);
        el.onload = () => resolve();
        el.onerror = () => reject(new Error("Skrip pembayaran gagal dimuat"));
        document.body.appendChild(el);
    });
}