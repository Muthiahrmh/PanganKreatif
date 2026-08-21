import { api } from "@/lib/api";
import type { DaftarNotifikasi } from "@/types/notification";

export async function ambilNotifikasi() {
    const res = await api.get<DaftarNotifikasi>("/notifications");
    return res.data;
}

const KUNCI_TERAKHIR = "pangankreatif-notif-dilihat";

/**
 * Waktu terakhir panel notifikasi dibuka, disimpan di peramban.
 *
 * Notifikasi diturunkan dari keadaan data, bukan disimpan di basis
 * data, jadi tidak ada kolom "sudah dibaca". Menyimpan waktu lihat
 * terakhir di sisi peramban sudah cukup untuk menandai yang baru.
 */
export function waktuTerakhirDilihat(): number {
    if (typeof window === "undefined") return 0;
    const nilai = window.localStorage.getItem(KUNCI_TERAKHIR);
    return nilai ? Number(nilai) : 0;
}

export function tandaiSudahDilihat() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KUNCI_TERAKHIR, String(Date.now()));
}