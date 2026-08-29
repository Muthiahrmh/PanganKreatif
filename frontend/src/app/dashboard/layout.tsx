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
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            </div>
        );
    }

    if (!user) return null;

    // Menghindari error jika role tidak terdefinisi di temaPeran
    const tema = user.role ? temaPeran(user.role) : { latar: "#f8fafc" };

    return (
        <div className="flex min-h-screen" style={{ backgroundColor: tema?.latar ?? "#f8fafc" }}>
            <DashboardSidebar />

            <div className="flex min-w-0 flex-1 flex-col">
                <DashboardTopbar />
                <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}