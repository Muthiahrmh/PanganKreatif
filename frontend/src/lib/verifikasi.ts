import { api } from "@/lib/api";

export interface HasilPendaftaran {
    perluVerifikasi: boolean;
    email: string;
    emailTerkirim: boolean;
    pesan: string;
}

export interface HasilVerifikasi {
    berhasil: boolean;
    sudahPernah: boolean;
    email: string;
    nama?: string;
}

export async function verifikasiEmail(token: string) {
    const res = await api.post<HasilVerifikasi>("/auth/verify", { token });
    return res.data;
}

export async function kirimUlangVerifikasi(email: string) {
    const res = await api.post<{ pesan: string }>("/auth/verify/resend", { email });
    return res.data;
}