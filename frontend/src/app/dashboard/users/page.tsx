"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Users, Building2, Store, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { temaPeran } from "@/components/dashboard/roleTheme";
import { getApiErrorMessage } from "@/lib/api";
import { fetchAdminUsers } from "@/lib/transactions";
import { formatDate } from "@/lib/format";
import type { AdminUser } from "@/types/transaction";

const ITEMS_PER_PAGE = 8;

export default function UsersPage() {
    const user = useAuthStore((s) => s.user);
    const tema = temaPeran(user?.role ?? "admin");
    const warnaPeran = {
        "--warna-peran": tema.aksen,
        "--warna-peran-latar": tema.latar,
        "--warna-gelap": tema.sidebar,
    } as CSSProperties;
    const [rows, setRows] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "umkm" | "supplier">("all");
    const [currentPage, setCurrentPage] = useState(1);

    const load = useCallback(async () => {
        try {
            setRows(await fetchAdminUsers());
            setError(null);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (user && user.role !== "admin") {
        return (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-500 shadow-sm">
                Halaman ini khusus untuk administrator platform.
            </div>
        );
    }

    const visible = filter === "all" ? rows : rows.filter((r) => r.role === filter);
    const totalPages = Math.ceil(visible.length / ITEMS_PER_PAGE);
    const paginatedVisible = visible.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const totalUmkm = rows.filter((r) => r.role === "umkm").length;
    const totalSupplier = rows.filter((r) => r.role === "supplier").length;

    return (
        <div className="flex flex-col gap-6 md:gap-8 pb-12" style={warnaPeran}>
            {/* Hero Header — gradasi gelap bernuansa warna peran */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[var(--warna-gelap)] via-[var(--warna-gelap)] to-[var(--warna-peran)] p-6 sm:p-10 text-white shadow-2xl shadow-black/10">
                <div
                    className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-[70px]"
                    style={{ backgroundColor: "var(--warna-peran)", opacity: 0.4 }}
                />
                <div
                    className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full blur-[60px]"
                    style={{ backgroundColor: "var(--warna-peran)", opacity: 0.2 }}
                />
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                        <Users size={14} /> Manajemen Ekosistem
                    </div>
                    <h2 className="mt-4 font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
                        Seluruh Mitra & Pengguna
                    </h2>
                    <p className="mt-2 text-sm font-medium text-white/70 max-w-2xl leading-relaxed">
                        Daftar lengkap UMKM kuliner dan pemasok (kelompok tani/distributor) yang tergabung di dalam ekosistem PanganKreatif.
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 shadow-sm">
                    {error}
                </div>
            )}

            {/* Statistik Ringkas */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Total Pengguna</div>
                        <div className="font-display text-2xl font-black text-slate-900 mt-1">{rows.length}</div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--warna-peran-latar)] text-[var(--warna-peran)]">
                        <Users size={22} />
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">UMKM Kuliner</div>
                        <div className="font-display text-2xl font-black text-blue-600 mt-1">{totalUmkm}</div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Store size={22} />
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Pemasok / Tani</div>
                        <div className="font-display text-2xl font-black text-emerald-600 mt-1">{totalSupplier}</div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <Building2 size={22} />
                    </div>
                </div>
            </div>

            {/* Filter Tab */}
            <div className="flex gap-2.5 overflow-x-auto pb-2">
                {(["all", "umkm", "supplier"] as const).map((f) => {
                    const label = f === "all" ? "Semua Mitra" : f === "umkm" ? "UMKM Kuliner" : "Pemasok / Tani";
                    const count = f === "all" ? rows.length : rows.filter((r) => r.role === f).length;
                    // "Semua" pakai warna aksen admin (peran pemilik halaman ini),
                    // sedangkan UMKM/Pemasok tetap pakai warna kategori masing-masing
                    // biar konsisten dengan badge peran di tabel.
                    const kelasAktif =
                        f === "umkm"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                            : f === "supplier"
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                                : "bg-[var(--warna-peran)] text-white shadow-md shadow-black/10";

                    return (
                        <button
                            key={f}
                            onClick={() => {
                                setFilter(f);
                                setCurrentPage(1);
                            }}
                            className={`shrink-0 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${filter === f ? kelasAktif : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {label} ({count})
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-20 animate-pulse rounded-3xl bg-slate-100" />
                    ))}
                </div>
            ) : paginatedVisible.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                    <Users size={36} className="mx-auto text-slate-400 mb-3" />
                    <h3 className="font-display text-base font-bold text-slate-800">
                        Belum ada mitra terdaftar
                    </h3>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        {/* Tabel Desktop */}
                        <table className="hidden w-full text-left text-sm md:table">
                            <thead className="bg-slate-50/75 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Nama Usaha / Mitra</th>
                                    <th className="px-6 py-4">Peran</th>
                                    <th className="px-6 py-4">Kota</th>
                                    <th className="px-6 py-4">Kontak</th>
                                    <th className="px-6 py-4">Bergabung</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedVisible.map((r) => (
                                    <tr key={r.id} className="transition hover:bg-slate-50/80">
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            {r.businessName ?? r.name}
                                            {r.businessType && (
                                                <div className="text-xs font-normal text-slate-400 mt-0.5">
                                                    {r.businessType}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${r.role === "supplier"
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                        : "bg-blue-50 text-blue-700 border border-blue-100"
                                                    }`}
                                            >
                                                {r.role === "supplier" ? "Pemasok / Tani" : "UMKM Kuliner"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-600">{r.city ?? "-"}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="font-semibold">{r.email}</div>
                                            {r.phone && <div className="text-xs text-slate-400">{r.phone}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium">
                                            {formatDate(r.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Kartu Mobile */}
                        <div className="divide-y divide-slate-100 md:hidden">
                            {paginatedVisible.map((r) => (
                                <div key={r.id} className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="truncate font-bold text-slate-900 text-base">
                                                {r.businessName ?? r.name}
                                            </div>
                                            {r.businessType && (
                                                <div className="truncate text-xs text-slate-500 mt-0.5">
                                                    {r.businessType}
                                                </div>
                                            )}
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${r.role === "supplier"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-blue-50 text-blue-700"
                                                }`}
                                        >
                                            {r.role === "supplier" ? "Pemasok" : "UMKM"}
                                        </span>
                                    </div>

                                    <div className="mt-3 space-y-1 text-xs font-medium text-slate-500">
                                        <div>Kota: <strong className="text-slate-700">{r.city ?? "-"}</strong></div>
                                        <div className="truncate">Email: <strong className="text-slate-700">{r.email}</strong></div>
                                        {r.phone && <div>Telp: <strong className="text-slate-700">{r.phone}</strong></div>}
                                        <div>Bergabung: <strong className="text-slate-700">{formatDate(r.createdAt)}</strong></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Kontrol Paginasi */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <div className="text-xs font-medium text-slate-500">
                                Menampilkan halaman <strong className="text-slate-800">{currentPage}</strong> dari <strong className="text-slate-800">{totalPages}</strong> (Total {visible.length} mitra)
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={15} /> Sebelumnya
                                </button>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Berikutnya <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}