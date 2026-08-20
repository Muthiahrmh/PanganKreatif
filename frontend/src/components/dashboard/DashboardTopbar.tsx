"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getNavItems, getPageTitle } from "./navItems";

export function DashboardTopbar() {
    const pathname = usePathname();
    const user = useAuthStore((s) => s.user);

    const navItems = getNavItems(user?.role);

    const displayName =
        user?.role === "supplier"
            ? user?.supplierProfile?.groupName ?? user?.name
            : user?.umkmProfile?.businessName ?? user?.name;

    return (
        <div className="border-b border-ink/5 bg-white">
            <div className="flex items-center justify-between px-6 py-4">
                <div>
                    <h1 className="font-display text-xl font-bold text-ink">
                        {getPageTitle(pathname, user?.role)}
                    </h1>

                    <p className="mt-1 text-sm text-ink-soft">
                        Selamat datang kembali,
                        <span className="font-medium text-ink"> {displayName}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        aria-label="Notifikasi"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-soft text-ink-soft transition hover:bg-slate-100"
                    >
                        <Bell size={18} />
                    </button>

                    <Link href="/dashboard/profile" aria-label="Profil">
                        {user?.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={user.avatarUrl}
                                alt="Foto profil"
                                className="h-10 w-10 rounded-full object-cover ring-2 ring-ink/5"
                            />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue font-semibold text-white">
                                {(displayName ?? "U").charAt(0).toUpperCase()}
                            </div>
                        )}
                    </Link>
                </div>
            </div>

            {/* Navigasi mobile */}
            <div className="flex gap-1 overflow-x-auto px-4 pb-3 md:hidden">
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
                            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${active
                                    ? "bg-brand-blue text-white"
                                    : "bg-paper-soft text-ink-soft"
                                }`}
                        >
                            <Icon size={13} />
                            {item.shortLabel}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}