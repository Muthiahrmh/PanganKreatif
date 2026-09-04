"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, Headset } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getNavItems, getPageTitle } from "./navItems";
import { temaPeran } from "./roleTheme";
import { PanelNotifikasi } from "./PanelNotifikasi";

export function DashboardTopbar() {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const [menuTerbuka, setMenuTerbuka] = useState(false);

    const navItems = getNavItems(user?.role);
    const tema = temaPeran(user?.role);

    const displayName =
        user?.role === "supplier"
            ? user?.supplierProfile?.groupName ?? user?.name
            : user?.umkmProfile?.businessName ?? user?.name;

    useEffect(() => {
        document.body.style.overflow = menuTerbuka ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [menuTerbuka]);

    const tutupMenu = () => setMenuTerbuka(false);

    function keluar() {
        tutupMenu();
        logout();
        router.push("/");
    }

    return (
        <>
            {/* Topbar mengikuti aksen warna peran, bukan putih generik buat semua orang */}
            <header
                className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white px-4 sm:px-6"
                style={{ borderBottom: `3px solid ${tema.aksen}` }}
            >
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        onClick={() => setMenuTerbuka(true)}
                        aria-label="Buka menu"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 md:hidden"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="min-w-0">
                        <h1 className="truncate font-display text-lg font-bold text-slate-900">
                            {getPageTitle(pathname, user?.role)}
                        </h1>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <Link
                        href="/bantuan"
                        aria-label="Pusat bantuan"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    >
                        <Headset size={18} />
                    </Link>

                    <PanelNotifikasi aksen={tema.aksen} />

                    <div className="hidden sm:block h-5 w-px bg-slate-200 mx-1"></div>

                    <Link href="/dashboard/profile" className="flex items-center gap-2.5 rounded-full hover:opacity-80">
                        <span className="hidden text-sm font-semibold text-slate-700 sm:block">
                            {displayName}
                        </span>
                        {user?.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={user.avatarUrl}
                                alt="Profil"
                                className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                            />
                        ) : (
                            <div
                                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ring-1 ring-slate-200"
                                style={{ backgroundColor: tema.aksen }}
                            >
                                {(displayName ?? "U").charAt(0).toUpperCase()}
                            </div>
                        )}
                    </Link>
                </div>
            </header>

            {/* Laci Menu HP Ramping */}
            {menuTerbuka && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    <button
                        aria-label="Tutup menu"
                        onClick={tutupMenu}
                        className="absolute inset-0 h-full w-full bg-slate-900/50 transition-opacity"
                    />

                    <aside
                        className="relative flex h-full w-[250px] max-w-[80%] flex-col overflow-y-auto px-4 pb-6 pt-6 text-white shadow-2xl"
                        style={{ backgroundColor: tema.sidebar }}
                    >
                        <div className="flex items-start justify-between px-2 pb-6">
                            <Image
                                src="/images/logo-pangankreatif.png"
                                alt="PanganKreatif"
                                width={1033}
                                height={370}
                                className="h-auto w-32"
                            />
                            <button
                                onClick={tutupMenu}
                                aria-label="Tutup menu"
                                className="text-slate-400 hover:text-white mt-1"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="px-2 mb-2">
                            <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white uppercase tracking-wider shadow-sm border border-white/5">
                                <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                {tema.penanda}
                            </div>
                        </div>

                        <nav className="mt-4 flex flex-col gap-1.5">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const aktif =
                                    pathname === item.href ||
                                    (item.href !== "/dashboard" &&
                                        pathname.startsWith(`${item.href}/`));

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={tutupMenu}
                                        className={`relative flex items-center gap-4 rounded-xl px-4 py-3.5 text-[14px] font-bold transition-all ${
                                            aktif
                                                ? "text-white shadow-lg"
                                                : "text-slate-400 hover:text-white"
                                        }`}
                                        style={aktif ? { backgroundColor: tema.aktif } : undefined}
                                    >
                                        {aktif && (
                                            <span className="absolute left-0 top-1/2 h-7 w-1.5 -translate-y-1/2 rounded-r-md bg-white" />
                                        )}
                                        <Icon size={20} className={aktif ? "opacity-100" : "opacity-80"} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-auto pt-6 border-t border-white/10">
                            <button
                                onClick={keluar}
                                className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-[14px] font-bold text-slate-400 transition-colors hover:text-red-400"
                            >
                                <LogOut size={20} className="opacity-80" />
                                <span>Keluar</span>
                            </button>
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}