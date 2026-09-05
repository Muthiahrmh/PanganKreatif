export type Role = "umkm" | "supplier" | "admin";

export type EwalletProvider = "dana" | "gopay" | "shopeepay" | "ovo";

export interface UmkmProfile {
    id: string;
    businessName: string;
    businessType: string;
    city: string;
    address: string;
}

export interface SupplierProfile {
    id: string;
    groupName: string;
    city: string;
    address: string;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountHolder?: string | null;
    ewalletNumber?: string | null;
    ewalletHolder?: string | null;
    ewalletProviders?: EwalletProvider[];
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    phone?: string | null;
    avatarUrl?: string | null;
    createdAt?: string;
    umkmProfile?: UmkmProfile | null;
    supplierProfile?: SupplierProfile | null;
}

export interface AuthResponse {
    token: string;
    user: User;
    /** Hanya ada saat login baru saja lolos OTP — simpan dan kirim lagi
     *  di login berikutnya supaya perangkat ini tidak perlu OTP lagi. */
    deviceToken?: string;
}

/** Respons /auth/login tahap pertama saat lapis kedua (OTP) diaktifkan */
export interface LoginOtpResponse {
    perluOtp: true;
    email: string;
    berlakuMenit: number;
}

export interface ProfilePayload {
    name?: string;
    phone?: string | null;
    businessName?: string;
    businessType?: string;
    groupName?: string;
    city?: string;
    address?: string;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountHolder?: string | null;
    ewalletNumber?: string | null;
    ewalletHolder?: string | null;
    ewalletProviders?: EwalletProvider[];
}