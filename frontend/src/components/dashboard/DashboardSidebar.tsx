"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getNavItems, getRoleLabel } from "./navItems";
import { temaPeran } from "./roleTheme";

export function DashboardSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const navItems = getNavItems(user?.role);
    const tema = temaPeran(user?.role);

    const displayName =
        user?.role === "supplier"
            ? user?.supplierProfile?.groupName ?? user?.name
            : user?.umkmProfile?.businessName ?? user?.name;

    return (
        <aside
            className="sticky top-0 hidden h-screen w-[250px] shrink-0 flex-col justify-between px-3.5 pb-4 pt-6 text-white md:flex border-r border-white/5"
            style={{ backgroundColor: tema.sidebar }}
        >
            {/* Bagian Atas: Logo, Badge Peran, dan Navigasi */}
            <div className="flex flex-col">
                <div className="px-2.5">
                    <Image
                        src="/images/logo-pangankreatif.png"
                        alt="PanganKreatif"
                        width={1033}
                        height={370}
                        priority
                        className="h-auto w-32"
                    />

                    <div
                        className="mt-5 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider"
                        style={{ backgroundColor: `${tema.aksen}33` }}
                    >
                        <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: tema.aksen }}
                        />
                        {tema.penanda}
                    </div>
                </div>

                <nav className="mt-5 flex flex-col gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active =
                            pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                style={active ? { backgroundColor: tema.aktif } : undefined}
                                className={`relative flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold transition-colors ${active
                                        ? "text-white shadow-sm"
                                        : "text-white/60 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                {active && (
                                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-md bg-white" />
                                )}

                                <Icon size={17} className={active ? "opacity-100" : "opacity-75"} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bagian Bawah: Info Profil Ramping & Tombol Keluar */}
            <div className="border-t border-white/10 pt-3">
                <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5 transition-colors hover:bg-white/10"
                >
                    {user?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={user.avatarUrl}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                    ) : (
                        <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                            style={{ backgroundColor: tema.aksen }}
                        >
                            {(displayName ?? "U").charAt(0).toUpperCase()}
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold leading-tight text-white">
                            {displayName}
                        </div>
                        <div className="truncate text-[10.5px] text-white/50 leading-tight mt-0.5">
                            {getRoleLabel(user?.role)}
                        </div>
                    </div>
                </Link>

                <button
                    onClick={() => {
                        logout();
                        router.push("/");
                    }}
                    className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-red-400"
                >
                    <LogOut size={14} />
                    <span>Keluar Akun</span>
                </button>
            </div>
        </aside>
    );
}