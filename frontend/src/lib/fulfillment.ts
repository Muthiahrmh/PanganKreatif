import { api } from "@/lib/api";
import type { DataEscrowAdmin, FulfillmentStatus } from "@/types/fulfillment";

/** Pemasok: barang milik satu UMKM sudah berangkat. */
export async function tandaiDikirim(itemId: string) {
    const res = await api.post(`/procurement/items/${itemId}/kirim`);
    return res.data;
}

/**
 * UMKM: "Barang Sudah Diterima".
 * Ini yang membuka kunci dana pemasok — tidak ada tombol lain di sisi
 * admin maupun pemasok yang bisa menggantikannya pada alur normal.
 */
export async function konfirmasiDiterima(itemId: string, catatan?: string) {
    const res = await api.post(`/procurement/items/${itemId}/terima`, {
        ...(catatan?.trim() ? { catatan: catatan.trim() } : {}),
    });
    return res.data;
}

/** UMKM: laporkan masalah. Menghentikan hitungan konfirmasi otomatis. */
export async function ajukanKomplain(itemId: string, alasan: string) {
    const res = await api.post(`/procurement/items/${itemId}/komplain`, { alasan });
    return res.data;
}

/** Admin: daftar dana yang sedang ditahan beserta alasannya. */
export async function fetchEscrowDitahan() {
    const res = await api.get<DataEscrowAdmin>("/admin/escrow");
    return res.data;
}

/** Admin: lepas paksa untuk kasus sengketa. Alasan wajib dan tercatat. */
export async function lepasPaksaEscrow(itemId: string, alasan: string) {
    const res = await api.post(`/admin/escrow/${itemId}/lepas`, { alasan });
    return res.data;
}

/** Warna & label lencana status barang, dipakai ketiga peran. */
export const GAYA_FULFILLMENT: Record<
    FulfillmentStatus,
    { label: string; className: string }
> = {
    menunggu: {
        label: "Menunggu Dikirim",
        className: "bg-slate-100 text-slate-700 ring-slate-300",
    },
    dikirim: {
        label: "Dalam Pengiriman",
        className: "bg-blue-50 text-blue-700 ring-blue-600/30",
    },
    diterima: {
        label: "Barang Diterima",
        className: "bg-emerald-50 text-emerald-700 ring-emerald-600/30",
    },
    komplain: {
        label: "Komplain Diproses",
        className: "bg-red-50 text-red-700 ring-red-600/30",
    },
};

/**
 * Ubah sisa jam menjadi kalimat yang enak dibaca.
 * Backend mengirim jam, bukan tanggal, supaya tidak ada selisih zona
 * waktu antara server dan browser.
 */
export function sisaWaktuKonfirmasi(sisaJam?: number | null): string | null {
    if (sisaJam == null) return null;
    if (sisaJam <= 0) return "akan segera dilepas otomatis";
    if (sisaJam < 24) return `${sisaJam} jam lagi`;
    return `${Math.ceil(sisaJam / 24)} hari lagi`;
}
