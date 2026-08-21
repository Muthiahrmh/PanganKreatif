export type TingkatNotifikasi = "perlu_tindakan" | "baik" | "info";

export interface Notifikasi {
    id: string;
    tipe: string;
    tingkat: TingkatNotifikasi;
    judul: string;
    pesan: string;
    waktu: string;
    tautan: string;
}

export interface DaftarNotifikasi {
    total: number;
    perluTindakan: number;
    notifikasi: Notifikasi[];
}