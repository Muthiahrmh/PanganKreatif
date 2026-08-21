export type TingkatRisiko = "aman" | "rendah" | "sedang" | "tinggi";

export interface PrakiraanHarian {
    tanggal: string;
    deskripsi: string;
    risiko: TingkatRisiko;
    suhu: number | null;
    kelembapan: number | null;
    ikon: string | null;
}

export interface PeringatanCuaca {
    ada: boolean;
    tingkat: TingkatRisiko;
    pesan: string;
    hariBerisiko?: number;
}

export interface PrakiraanCuaca {
    tersedia: boolean;
    alasan?: string;
    kota: string | null;
    kecamatan?: string | null;
    diperbaruiPada?: string;
    harian?: PrakiraanHarian[];
    peringatan?: PeringatanCuaca;
    sumber?: string;
}