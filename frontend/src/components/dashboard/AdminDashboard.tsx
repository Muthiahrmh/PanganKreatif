"use client";

import { useCallback, useEffect, useState } from "react";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend,
} from "recharts";
import { Users, Store, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "./StatCard";
import { PaymentBadge } from "./PaymentBadge";
import { getApiErrorMessage } from "@/lib/api";
import { fetchAdminStats } from "@/lib/transactions";
import { formatDate, formatNumber, formatRupiah, formatRupiahShort } from "@/lib/format";
import type { AdminStats } from "@/types/transaction";

export function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setStats(await fetchAdminStats());
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

    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <h2 className="font-display font-bold text-red-800">Data gagal dimuat</h2>
                <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
        );
    }

    const f = stats?.finance;

    return (
        <div className="flex flex-col gap-6">
            <div className="rounded-2xl bg-gradient-to-r from-[#1B1A2E] to-[#D97706] p-6 text-white">
                <div className="text-xs font-medium text-white/70">Pengelola Platform</div>
                <h2 className="mt-1 font-display text-xl font-bold">Ringkasan Platform</h2>
                <p className="mt-1 text-sm text-white/85">
                    Kinerja bisnis PanganKreatif — mitra terdaftar, nilai transaksi, dan pendapatan
                    komisi.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={Users}
                    label="UMKM Terdaftar"
                    value={loading ? "..." : String(stats?.users.umkm ?? 0)}
                    sub="Mitra hilir"
                />
                <StatCard
                    icon={Store}
                    label="Pemasok Mitra"
                    value={loading ? "..." : String(stats?.users.supplier ?? 0)}
                    sub={`${stats?.catalog.products ?? 0} produk di katalog`}
                    color="text-brand-green"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Nilai Transaksi"
                    value={loading ? "..." : formatRupiahShort(f?.gmv ?? 0)}
                    sub={`${f?.successCount ?? 0} transaksi lunas`}
                    color="text-brand-blue"
                />
                <StatCard
                    icon={Wallet}
                    label="Pendapatan Komisi"
                    value={loading ? "..." : formatRupiahShort(f?.revenue ?? 0)}
                    sub={`Tarif ${((stats?.commissionRate ?? 0) * 100).toFixed(1)}% per transaksi`}
                    color="text-amber-500"
                />
            </div>

            {/* Ringkasan laba rugi — cerminan Bab V proposal */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold text-ink">Ikhtisar Keuangan</h3>
                <p className="mt-1 text-sm text-ink-soft">
                    Dihitung dari transaksi nyata di platform, mengikuti struktur laba rugi pada
                    rencana bisnis.
                </p>

                <div className="mt-5 space-y-2">
                    <MoneyRow
                        label="Pendapatan komisi"
                        value={f?.revenue ?? 0}
                        hint="Akumulasi komisi transaksi lunas"
                    />
                    <MoneyRow
                        label="Harga pokok penjualan"
                        value={-(f?.cogs ?? 0)}
                        hint={`${f?.successCount ?? 0} transaksi x biaya komputasi & verifikasi`}
                    />
                    <div className="border-t border-slate-100 pt-2">
                        <MoneyRow label="Laba kotor" value={f?.grossProfit ?? 0} bold />
                    </div>
                </div>

                {(f?.pendingCount ?? 0) > 0 && (
                    <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        {f?.pendingCount} pembayaran senilai {formatRupiah(f?.pendingValue ?? 0)}{" "}
                        masih menunggu konfirmasi pemasok dan belum dihitung sebagai pendapatan.
                    </p>
                )}
            </div>

            {/* Tren bulanan */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold text-ink">Tren 6 Bulan Terakhir</h3>

                <div className="mt-5 h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={stats?.series ?? []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="label" fontSize={12} />
                            <YAxis
                                yAxisId="left"
                                fontSize={12}
                                tickFormatter={(v) => formatRupiahShort(v)}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                fontSize={12}
                                tickFormatter={(v) => formatRupiahShort(v)}
                            />
                            <Tooltip
                                formatter={(value, name) => [formatRupiah(Number(value)), String(name)]}
                            />
                            <Legend />
                            <Bar
                                yAxisId="left"
                                dataKey="gmv"
                                name="Nilai transaksi"
                                fill="#2563eb"
                                radius={[4, 4, 0, 0]}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="revenue"
                                name="Komisi platform"
                                stroke="#16a34a"
                                strokeWidth={3}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Komoditas teratas */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h3 className="font-display text-lg font-bold text-ink">
                        Komoditas Paling Bernilai
                    </h3>

                    {loading ? (
                        <Skeleton count={3} />
                    ) : (stats?.topCommodities.length ?? 0) === 0 ? (
                        <p className="mt-4 text-sm text-ink-soft">
                            Belum ada transaksi lunas untuk dianalisis.
                        </p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {stats?.topCommodities.map((c) => {
                                const max = stats.topCommodities[0].value || 1;
                                return (
                                    <div key={c.name}>
                                        <div className="mb-1 flex justify-between text-sm">
                                            <span>{c.name}</span>
                                            <span className="font-semibold text-brand-blue">
                                                {formatRupiah(c.value)}
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-100">
                                            <div
                                                className="h-2 rounded-full bg-brand-blue"
                                                style={{
                                                    width: `${Math.max((c.value / max) * 100, 4)}%`,
                                                }}
                                            />
                                        </div>
                                        <div className="mt-1 text-xs text-ink-soft">
                                            {formatNumber(c.quantity)} {c.unit} tersalur
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Transaksi terbaru */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h3 className="font-display text-lg font-bold text-ink">Transaksi Terbaru</h3>

                    {loading ? (
                        <Skeleton count={4} />
                    ) : (stats?.recentTransactions.length ?? 0) === 0 ? (
                        <p className="mt-4 text-sm text-ink-soft">Belum ada transaksi tercatat.</p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {stats?.recentTransactions.map((t) => (
                                <div
                                    key={t.id}
                                    className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate font-medium text-ink">
                                            {t.umkm}
                                        </div>
                                        <div className="truncate text-xs text-ink-soft">
                                            {t.product} dari {t.supplier} · {formatDate(t.createdAt)}
                                        </div>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <div className="font-medium">{formatRupiah(t.amount)}</div>
                                        <div className="mt-1">
                                            <PaymentBadge status={t.status} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MoneyRow({
    label,
    value,
    hint,
    bold,
}: {
    label: string;
    value: number;
    hint?: string;
    bold?: boolean;
}) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <div>
                <span className={bold ? "font-semibold text-ink" : "text-ink-soft"}>{label}</span>
                {hint && <div className="text-xs text-ink-soft">{hint}</div>}
            </div>
            <span
                className={`shrink-0 font-display ${bold ? "text-lg font-bold" : "text-sm"} ${value < 0 ? "text-red-600" : "text-brand-green"
                    }`}
            >
                {value < 0 ? `- ${formatRupiah(Math.abs(value))}` : formatRupiah(value)}
            </span>
        </div>
    );
}

function Skeleton({ count }: { count: number }) {
    return (
        <div className="mt-4 space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
            ))}
        </div>
    );
}