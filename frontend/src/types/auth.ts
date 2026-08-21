export type Role = "umkm" | "supplier" | "admin";

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
}