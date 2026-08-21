import { api } from "@/lib/api";
import type { Panduan } from "@/types/onboarding";

export async function ambilPanduan() {
    const res = await api.get<Panduan>("/onboarding");
    return res.data;
}

const KUNCI_TUTUP = "pangankreatif-panduan-ditutup";

/** Pengguna boleh menutup panduan walau belum tuntas */
export function panduanDitutup(): boolean {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(KUNCI_TUTUP) === "1";
}

export function tutupPanduan() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KUNCI_TUTUP, "1");
}