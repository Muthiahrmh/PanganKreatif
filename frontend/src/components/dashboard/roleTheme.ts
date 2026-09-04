import type { Role } from "@/types/auth";

export interface TemaPeran {
    label: string;
    /** Latar sidebar dan laci navigasi */
    sidebar: string;
    /** Warna menu yang sedang aktif */
    aktif: string;
    /** Warna aksen untuk avatar dan penanda */
    aksen: string;
    /** Latar halaman, sedikit bernuansa warna peran */
    latar: string;
    /** Teks penanda peran di sidebar */
    penanda: string;
}

const TEMA: Record<Role, TemaPeran> = {
    umkm: {
        label: "UMKM Kuliner",
        // Biru tua yang jelas kebiruan, bukan sekadar gelap generik
        sidebar: "#0B1E3D",
        aktif: "#2563EB",
        aksen: "#2563EB",
        latar: "#EFF6FF",
        penanda: "Sisi Pembeli",
    },
    supplier: {
        label: "Kelompok Tani / Distributor",
        // Hijau hutan tua yang jelas kehijauan
        sidebar: "#0B2A1B",
        aktif: "#16A34A",
        aksen: "#16A34A",
        latar: "#F0FDF4",
        penanda: "Sisi Pemasok",
    },
    admin: {
        label: "Admin PanganKreatif",
        // Cokelat-oren tua yang jelas keoranyean, bukan ungu gelap
        sidebar: "#2B1706",
        aktif: "#D97706",
        aksen: "#D97706",
        latar: "#FFFBEB",
        penanda: "Pengelola Platform",
    },
};

export function temaPeran(role: Role | undefined): TemaPeran {
    return TEMA[role ?? "umkm"] ?? TEMA.umkm;
}