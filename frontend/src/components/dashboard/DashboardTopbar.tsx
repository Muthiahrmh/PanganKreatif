"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getNavItems, getPageTitle, getRoleLabel } from "./navItems";
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

    // Kunci gulir latar selama laci terbuka
    useEffect(() => {
        document.body.style.overflow = menuTerbuka ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [menuTerbuka]);

    // Ditutup lewat penanganan klik, bukan lewat efek — menutup laci
    // adalah akibat dari perbuatan pengguna, bukan sinkronisasi keadaan
    const tutupMenu = () => setMenuTerbuka(false);

    function keluar() {
        tutupMenu();
        logout();
        router.push("/");
    }

    return (
        <>
            <div className="border-b border-ink/5 bg-white">
                <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            onClick={() => setMenuTerbuka(true)}
                            aria-label="Buka menu"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink transition hover:bg-paper-soft md:hidden"
                        >
                            <Menu size={20} />
                        </button>

                        <div className="min-w-0">
                            <h1 className="truncate font-display text-lg font-bold text-ink sm:text-xl">
                                {getPageTitle(pathname, user?.role)}
                            </h1>

                            <p className="mt-0.5 hidden text-sm text-ink-soft sm:block">
                                Selamat datang kembali,
                                <span className="font-medium text-ink"> {displayName}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <PanelNotifikasi aksen={tema.aksen} />

                        <Link href="/dashboard/profile" aria-label="Profil">
                            {user?.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={user.avatarUrl}
                                    alt="Foto profil"
                                    className="h-10 w-10 rounded-full object-cover ring-2 ring-ink/5"
                                />
                            ) : (
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white"
                                    style={{ backgroundColor: tema.aksen }}
                                >
                                    {(displayName ?? "U").charAt(0).toUpperCase()}
                                </div>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Laci navigasi khusus layar kecil */}
            {menuTerbuka && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        aria-label="Tutup menu"
                        onClick={() => setMenuTerbuka(false)}
                        className="absolute inset-0 h-full w-full bg-ink/50"
                    />

                    <aside
                        className="absolute left-0 top-0 flex h-full w-72 max-w-[85%] flex-col p-4 text-white shadow-2xl"
                        style={{ backgroundColor: tema.sidebar }}
                    >
                        <div className="flex items-start justify-between">
                            <Image
                                src="/images/logo-pangankreatif.png"
                                alt="PanganKreatif"
                                width={1033}
                                height={370}
                                className="h-auto w-32"
                            />

                            <button
                                onClick={() => setMenuTerbuka(false)}
                                aria-label="Tutup menu"
                                className="rounded-lg p-1.5 text-white/60 transition hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <nav className="mt-6 flex flex-col gap-0.5 overflow-y-auto">
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
                                        aria-current={aktif ? "page" : undefined}
                                        style={aktif ? { backgroundColor: tema.aktif } : undefined}
                                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                            aktif ? "text-white" : "text-white/60 hover:text-white"
                                        }`}
                                    >
                                        <Icon size={17} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-auto pt-4">
                            <Link
                                href="/dashboard/profile"
                                onClick={tutupMenu}
                                className="mb-2 flex items-center gap-2.5 rounded-lg bg-white/5 p-3 text-xs"
                            >
                                {user?.avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={user.avatarUrl}
                                        alt=""
                                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold"
                                        style={{ backgroundColor: tema.aksen }}
                                    >
                                        {(displayName ?? "U").charAt(0).toUpperCase()}
                                    </div>
                                )}

                                <div className="min-w-0">
                                    <div className="truncate font-semibold">{displayName}</div>
                                    <div className="truncate text-white/50">
                                        {getRoleLabel(user?.role)}
                                    </div>
                                </div>
                            </Link>

                            <button
                                onClick={keluar}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/60 transition-colors hover:text-white"
                            >
                                <LogOut size={16} /> Keluar
                            </button>
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}