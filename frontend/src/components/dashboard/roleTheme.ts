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
        sidebar: "#18200b",
        aktif: "#2563EB",
        aksen: "#2563EB",
        latar: "#F5F9FF",
        penanda: "Sisi Pembeli",
    },
    supplier: {
        label: "Kelompok Tani / Distributor",
        sidebar: "#0C2318",
        aktif: "#16A34A",
        aksen: "#16A34A",
        latar: "#F4FAF6",
        penanda: "Sisi Pemasok",
    },
    admin: {
        label: "Admin PanganKreatif",
        sidebar: "#1B1A2E",
        aktif: "#D97706",
        aksen: "#D97706",
        latar: "#F8F7FC",
        penanda: "Pengelola Platform",
    },
};

export function temaPeran(role: Role | undefined): TemaPeran {
    return TEMA[role ?? "umkm"] ?? TEMA.umkm;
}