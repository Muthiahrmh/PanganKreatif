import {
    Home,
    Sparkles,
    ShoppingCart,
    NotebookPen,
    Package,
    ClipboardList,
    Store,
    Receipt,
    Users,
    UserCircle,
    Wallet,
    type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types/auth";

export interface NavItem {
    href: string;
    label: string;
    shortLabel: string;
    icon: LucideIcon;
}

const umkmNav: NavItem[] = [
    { href: "/dashboard", label: "Beranda", shortLabel: "Beranda", icon: Home },
    { href: "/dashboard/sales", label: "Riwayat Penjualan", shortLabel: "Penjualan", icon: NotebookPen },
    { href: "/dashboard/forecast", label: "Prediksi AI", shortLabel: "Prediksi AI", icon: Sparkles },
    { href: "/dashboard/suppliers", label: "Cari Pemasok", shortLabel: "Pemasok", icon: Store },
    { href: "/dashboard/procurement", label: "Belanja Kolektif", shortLabel: "Belanja", icon: ShoppingCart },
    { href: "/dashboard/transactions", label: "Transaksi", shortLabel: "Transaksi", icon: Receipt },
    { href: "/dashboard/profile", label: "Profil", shortLabel: "Profil", icon: UserCircle },
];

const supplierNav: NavItem[] = [
    { href: "/dashboard", label: "Beranda", shortLabel: "Beranda", icon: Home },
    { href: "/dashboard/products", label: "Produk Saya", shortLabel: "Produk", icon: Package },
    { href: "/dashboard/orders", label: "Pesanan Kolektif", shortLabel: "Pesanan", icon: ClipboardList },
    { href: "/dashboard/transactions", label: "Pembayaran", shortLabel: "Bayar", icon: Receipt },
    { href: "/dashboard/profile", label: "Profil", shortLabel: "Profil", icon: UserCircle },
];

const adminNav: NavItem[] = [
    { href: "/dashboard", label: "Ringkasan Platform", shortLabel: "Ringkasan", icon: Home },
    { href: "/dashboard/transactions", label: "Transaksi", shortLabel: "Transaksi", icon: Receipt },
    { href: "/dashboard/payouts", label: "Penerusan Dana", shortLabel: "Payout", icon: Wallet },
    { href: "/dashboard/users", label: "Mitra Terdaftar", shortLabel: "Mitra", icon: Users },
    { href: "/dashboard/profile", label: "Profil", shortLabel: "Profil", icon: UserCircle },
];

export function getNavItems(role: Role | undefined): NavItem[] {
    if (role === "supplier") return supplierNav;
    if (role === "admin") return adminNav;
    return umkmNav;
}

// Halaman yang BISA diakses tapi TIDAK muncul di sidebar (misalnya lewat ikon
// lonceng di topbar) — perlu judul sendiri di sini, supaya getPageTitle tidak
// salah "nyantol" ke item /dashboard (Beranda/Ringkasan Platform) yang paling umum.
const judulEkstra: { href: string; label: string }[] = [
    { href: "/dashboard/notifikasi", label: "Notifikasi" },
];

export function getPageTitle(pathname: string, role: Role | undefined): string {
    const kandidat: { href: string; label: string }[] = [
        ...getNavItems(role).map(({ href, label }) => ({ href, label })),
        ...judulEkstra,
    ];
    // Cocokkan yang paling spesifik dulu, biar /dashboard nggak nangkep semua
    const match = [...kandidat]
        .sort((a, b) => b.href.length - a.href.length)
        .find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
    return match?.label ?? "Dashboard";
}

export function getRoleLabel(role: Role | undefined): string {
    if (role === "supplier") return "Kelompok Tani / Distributor";
    if (role === "admin") return "Admin PanganKreatif";
    return "UMKM Kuliner";
}