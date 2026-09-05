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
    const tema = user.role ? temaPeran(user.role) : { latar: "#f8fafc", aksen: "#2563EB" };

    return (
        <div className="relative min-h-screen bg-cream">
            {/* Cahaya lembut senada warna peran di balik konten — menggantikan
                latar polos satu warna rata, tapi tetap netral begitu turun
                supaya kartu putih di dalamnya tetap kontras. Dipisah jadi
                lapisan tersendiri (bukan pembungkus sidebar/topbar) supaya
                overflow-hidden di sini tidak merusak posisi "sticky" sidebar. */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    className="absolute inset-x-0 top-0 h-[28rem]"
                    style={{ background: `linear-gradient(180deg, ${tema.latar} 0%, rgba(251,249,243,0) 100%)` }}
                />
                <div
                    className="absolute -top-36 left-[10%] h-80 w-80 rounded-full blur-3xl"
                    style={{ backgroundColor: tema.aksen, opacity: 0.14 }}
                />
                <div
                    className="absolute -top-24 right-[6%] h-72 w-72 rounded-full blur-3xl"
                    style={{ backgroundColor: tema.aksen, opacity: 0.08 }}
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