"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const hydrated = useAuthStore((s) => s.hydrated);

    // Tunggu zustand selesai baca localStorage sebelum memutuskan redirect,
    // kalau tidak user yang sudah login ikut kelempar ke /login saat refresh.
    useEffect(() => {
        if (hydrated && !user) router.replace("/login");
    }, [hydrated, user, router]);

    if (!hydrated) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/10 border-t-brand-green" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-paper-soft/40">
            <DashboardSidebar />

            <div className="flex min-w-0 flex-1 flex-col">
                <DashboardTopbar />
                <main className="flex-1 p-4 sm:p-6">{children}</main>
            </div>
        </div>
    );
}