"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { temaPeran } from "@/components/dashboard/roleTheme";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const hydrated = useAuthStore((s) => s.hydrated);
    const pernahMasuk = useRef(false);

    useEffect(() => {
        if (user) pernahMasuk.current = true;
    }, [user]);

    useEffect(() => {
        if (!hydrated || user) return;

        router.replace(pernahMasuk.current ? "/" : "/login");
    }, [hydrated, user, router]);

    if (!hydrated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-cream">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            </div>
        );
    }

    if (!user) return null;

    // Menghindari error jika role tidak terdefinisi di temaPeran
    const tema = user.role
        ? temaPeran(user.role)
        : { latar: "#f8fafc", latarKuat: "#e2e8f0", aksen: "#2563EB" };

    return (
        // Latar belakangnya sekarang warna peran RATA di seluruh tinggi
        // halaman (bukan cuma gradasi di atas yang lama-lama memudar jadi
        // krem/putih pas discroll) — biar konsisten "biru" buat UMKM,
        // "hijau" buat tani, "oren" buat admin dari atas sampai bawah.
        // Kartu-kartu konten tetap putih di atasnya biar kontras & gampang
        // dibaca.
        <div className="relative min-h-screen" style={{ backgroundColor: tema.latar }}>
            {/* Gradasi lembut di bagian atas pakai nuansa yang lebih pekat
                (latarKuat) supaya ada kedalaman & terasa jelas warnanya,
                lalu meluruh ke warna dasar latar (bukan ke krem/putih)
                supaya transisinya mulus tanpa ganti hue. */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    className="absolute inset-x-0 top-0 h-[28rem]"
                    style={{ background: `linear-gradient(180deg, ${tema.latarKuat} 0%, ${tema.latar}00 100%)` }}
                />
                <div
                    className="absolute -top-36 left-[10%] h-80 w-80 rounded-full blur-3xl"
                    style={{ backgroundColor: tema.aksen, opacity: 0.18 }}
                />
                <div
                    className="absolute -top-24 right-[6%] h-72 w-72 rounded-full blur-3xl"
                    style={{ backgroundColor: tema.aksen, opacity: 0.12 }}
                />
            </div>

            <div className="relative flex min-h-screen">
                <DashboardSidebar />

                <div className="flex min-w-0 flex-1 flex-col">
                    <DashboardTopbar />
                    <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
                </div>
            </div>
        </div>
    );
}