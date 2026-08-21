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
            className="hidden w-60 shrink-0 flex-col px-4 pb-5 pt-3 text-white md:flex"
            style={{ backgroundColor: tema.sidebar }}
        >
            <Image
                src="/images/logo-pangankreatif.png"
                alt="PanganKreatif"
                width={1033}
                height={370}
                priority
                className="h-auto w-36"
            />

            <div
                className="mt-3 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-medium text-white"
                style={{ backgroundColor: `${tema.aksen}33` }}
            >
                <span
                    className="mr-1.5 h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: tema.aksen }}
                />
                {tema.penanda}
            </div>

            <nav className="mt-4 flex flex-col gap-0.5">
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
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "text-white" : "text-white/60 hover:text-white"
                                }`}
                        >
                            <Icon size={17} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto">
                <Link
                    href="/dashboard/profile"
                    className="mb-3 flex items-center gap-2.5 rounded-lg bg-white/5 p-3 text-xs transition-colors hover:bg-white/10"
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
                        <div className="truncate text-white/50">{getRoleLabel(user?.role)}</div>
                    </div>
                </Link>

                <button
                    onClick={() => {
                        logout();
                        router.push("/");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:text-white"
                >
                    <LogOut size={16} /> Keluar
                </button>
            </div>
        </aside>
    );
}