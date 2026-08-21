export interface LangkahPanduan {
    kode: string;
    judul: string;
    pesan: string;
    selesai: boolean;
    tautan: string;
    aksi: string;
    jumlah: number;
}

export interface Panduan {
    berlaku: boolean;
    total: number;
    selesai: number;
    tuntas: boolean;
    langkah: LangkahPanduan[];
}