"use client";

import { useAuthStore } from "@/store/authStore";
import { SupplierDashboard } from "@/components/dashboard/SupplierDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { UmkmDashboardHome } from "@/components/dashboard/UmkmDashboardHome";

export default function DashboardPage() {
    const user = useAuthStore((s) => s.user);

    if (!user) return null;

    if (user.role === "supplier") return <SupplierDashboard />;
    if (user.role === "admin") return <AdminDashboard />;
    return <UmkmDashboardHome />;
}