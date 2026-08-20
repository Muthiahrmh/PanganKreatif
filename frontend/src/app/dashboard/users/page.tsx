"use client";

import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/lib/api";
import { fetchAdminUsers } from "@/lib/transactions";
import { formatDate } from "@/lib/format";
import type { AdminUser } from "@/types/transaction";

export default function UsersPage() {
    const user = useAuthStore((s) => s.user);
    const [rows, setRows] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "umkm" | "supplier">("all");

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    if (user && user.role !== "admin") {
        return <p className="text-sm text-ink-soft">Halaman ini khusus untuk admin platform.</p>;
    }

    const visible = filter === "all" ? rows : rows.filter((r) => r.role === filter);

    return (
        <div className="flex flex-col gap-5">
            <p className="text-sm text-ink-soft">
                Seluruh UMKM kuliner dan pemasok yang bergabung di PanganKreatif.
            </p>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
                {(["all", "umkm", "supplier"] as const).map((f) => {
                    const label = f === "all" ? "Semua" : f === "umkm" ? "UMKM" : "Pemasok";
                    const count = f === "all" ? rows.length : rows.filter((r) => r.role === f).length;

                    return (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === f
                                    ? "bg-brand-blue text-white"
                                    : "bg-paper-soft text-ink-soft hover:text-ink"
                                }`}
                        >
                            {label} ({count})
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                </div>
            ) : visible.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink/15 bg-white p-10 text-center">
                    <Users size={26} className="mx-auto text-ink-soft" />
                    <h3 className="mt-3 font-display text-base font-bold text-ink">
                        Belum ada mitra
                    </h3>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-ink/5 bg-white shadow-sm">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="bg-paper-soft text-xs font-semibold text-ink-soft">
                            <tr>
                                <th className="px-5 py-3">Nama Usaha</th>
                                <th className="px-5 py-3">Peran</th>
                                <th className="px-5 py-3">Kota</th>
                                <th className="px-5 py-3">Kontak</th>
                                <th className="px-5 py-3">Bergabung</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((r) => (
                                <tr key={r.id} className="border-t border-slate-100">
                                    <td className="px-5 py-3 font-medium text-ink">
                                        {r.businessName ?? r.name}
                                        {r.businessType && (
                                            <div className="text-xs font-normal text-ink-soft">
                                                {r.businessType}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.role === "supplier"
                                                    ? "bg-green-50 text-green-700"
                                                    : "bg-blue-50 text-brand-blue"
                                                }`}
                                        >
                                            {r.role === "supplier" ? "Pemasok" : "UMKM"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-ink-soft">{r.city ?? "-"}</td>
                                    <td className="px-5 py-3 text-ink-soft">
                                        {r.email}
                                        {r.phone && <div className="text-xs">{r.phone}</div>}
                                    </td>
                                    <td className="px-5 py-3 text-ink-soft">
                                        {formatDate(r.createdAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}