import type { Role } from "@/types/auth";

export interface TemaPeran {
    label: string;
    /** Latar sidebar dan laci navigasi */
    sidebar: string;
    /** Warna menu yang sedang aktif */
    aktif: string;
    /** Warna aksen untuk avatar dan penanda */
    aksen: string;
    /** Latar halaman, sedikit bernuansa warna peran — dipakai sebagai
     *  warna dasar RATA di seluruh tinggi halaman (bukan cuma di atas),
     *  supaya nuansanya tetap kerasa & stabil pas discroll ke bawah. */
    latar: string;
    /** Nuansa yang lebih pekat dari `latar`, dipakai buat gradasi lembut
     *  di bagian atas halaman biar ada kedalaman, tanpa bikin kartu putih
     *  di dalamnya jadi kurang kontras. */
    latarKuat: string;
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
        // Dinaikkan satu tingkat dari nuansa biru-50 (nyaris putih) ke
        // biru-100/200 supaya beneran kebaca "biru" sekilas, bukan cuma
        // krem/putih dengan semburat tipis.
        latar: "#DBEAFE",
        latarKuat: "#BFDBFE",
        penanda: "Sisi Pembeli",
    },
    supplier: {
        label: "Kelompok Tani / Distributor",
        // Hijau hutan tua yang jelas kehijauan
        sidebar: "#0B2A1B",
        aktif: "#16A34A",
        aksen: "#16A34A",
        latar: "#DCFCE7",
        latarKuat: "#BBF7D0",
        penanda: "Sisi Pemasok",
    },
    admin: {
        label: "Admin PanganKreatif",
        // Cokelat-oren tua yang jelas keoranyean, bukan ungu gelap
        sidebar: "#2B1706",
        aktif: "#D97706",
        aksen: "#D97706",
        latar: "#FEF3C7",
        latarKuat: "#FDE68A",
        penanda: "Pengelola Platform",
    },
};

export function temaPeran(role: Role | undefined): TemaPeran {
    return TEMA[role ?? "umkm"] ?? TEMA.umkm;
}