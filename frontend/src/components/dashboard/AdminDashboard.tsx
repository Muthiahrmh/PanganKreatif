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
import {
    Users,
    Store,
    TrendingUp,
    Wallet,
    ShieldCheck,
    Activity,
    PackageSearch,
    ListOrdered
} from "lucide-react";
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
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <h2 className="font-display font-bold text-red-800">Data gagal dimuat</h2>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                >
                    Muat ulang
                </button>
            </div>
        );
    }

    const f = stats?.finance;

    return (
        <div className="flex flex-col gap-6 md:gap-8 pb-10">
            {/* Banner Utama Admin (Tema Oranye Kendali Premium) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1F1406] via-[#3F2708] to-[#D97706] p-6 sm:p-8 md:p-10 text-white shadow-2xl border border-amber-900/40">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-10 h-72 w-72 rounded-full bg-orange-400/15 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-amber-200 backdrop-blur-md border border-white/10 mb-4">
                            <ShieldCheck size={14} className="text-amber-300" />
                            Pusat Kendali Platform
                        </div>
                        <h2 className="font-display text-2xl md:text-4xl font-extrabold tracking-tight text-white">
                            Ringkasan Ekosistem
                        </h2>
                        <p className="mt-2.5 text-sm md:text-base text-amber-100/80 max-w-xl leading-relaxed">
                            Pantau metrik utama, pergerakan nilai transaksi kotor (GMV), serta arus pendapatan komisi dari PanganKreatif secara *real-time*.
                        </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                        <Activity className="text-amber-300" size={24} />
                        <div>
                            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Status Server</div>
                            <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Online & Stabil
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KARTU STATISTIK ADMIN */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={Users}
                    label="UMKM Terdaftar"
                    value={loading ? "..." : `${stats?.users.umkm ?? 0} mitra`}
                    sub="Pengguna aktif di hilir"
                    color="text-amber-600"
                />
                <StatCard
                    icon={Store}
                    label="Pemasok Mitra"
                    value={loading ? "..." : `${stats?.users.supplier ?? 0} mitra`}
                    sub={`${stats?.catalog.products ?? 0} komoditas di katalog`}
                    color="text-amber-600"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Nilai Transaksi (GMV)"
                    value={loading ? "..." : formatRupiahShort(f?.gmv ?? 0)}
                    sub={loading ? "" : `${formatRupiah(f?.gmv ?? 0)} · ${f?.successCount ?? 0} tranksaksi`}
                    color="text-amber-600"
                />
                <StatCard
                    icon={Wallet}
                    label="Pendapatan Bersih"
                    value={loading ? "..." : formatRupiahShort(f?.revenue ?? 0)}
                    sub={
                        loading
                            ? ""
                            : `Komisi ${formatRupiahShort(f?.komisi ?? 0)} + Margin ${formatRupiahShort(f?.margin ?? 0)}`
                    }
                    color="text-emerald-600"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Ikhtisar Keuangan (Laba Rugi) */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm lg:col-span-1 flex flex-col">
                    <h3 className="font-display text-lg font-bold text-slate-900">Buku Besar Keuangan</h3>
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                        Rekapitulasi berdasarkan transaksi riil, merujuk pada struktur rancangan laba rugi bisnis.
                    </p>

                    <div className="mt-6 flex-1 space-y-4">
                        <MoneyRow
                            label="Komisi Transaksi"
                            value={f?.komisi ?? 0}
                            hint={`Tarif ${((stats?.commissionRate ?? 0) * 100).toFixed(1)}% dari nilai transaksi`}
                        />
                        <MoneyRow
                            label="Margin Distribusi"
                            value={f?.margin ?? 0}
                            hint="Imbalan volume grosir disalurkan"
                        />

                        <div className="border-t-2 border-dashed border-slate-100 pt-4">
                            <MoneyRow label="Total Pendapatan" value={f?.revenue ?? 0} bold />
                        </div>

                        <MoneyRow
                            label="Harga Pokok (HPP)"
                            value={-(f?.cogs ?? 0)}
                            hint={`${f?.successCount ?? 0} tx × beban server & verifikasi`}
                        />

                        <div className="border-t-2 border-slate-800 pt-4 mt-2">
                            <MoneyRow label="Laba Kotor" value={f?.grossProfit ?? 0} bold total />
                        </div>
                    </div>

                    {(f?.pendingCount ?? 0) > 0 && (
                        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 leading-relaxed shadow-sm">
                            <span className="font-bold">{f?.pendingCount} pembayaran</span> senilai <span className="font-bold">{formatRupiah(f?.pendingValue ?? 0)}</span> masih dalam proses kliring pemasok dan belum dibukukan.
                        </div>
                    )}
                </div>

                {/* Grafik Tren Bulanan */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm lg:col-span-2 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-display text-lg font-bold text-slate-900">Pergerakan GMV & Komisi</h3>
                            <p className="mt-1 text-xs text-slate-500">Tren pertumbuhan 6 bulan terakhir</p>
                        </div>
                    </div>

                    <div className="mt-2 h-72 w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={stats?.series ?? []} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                                <YAxis
                                    yAxisId="left"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => formatRupiahShort(v)}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => formatRupiahShort(v)}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value, name) => [
                                        formatRupiah(Number(value)),
                                        String(name),
                                    ]}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} iconType="circle" />
                                <Bar
                                    yAxisId="left"
                                    dataKey="gmv"
                                    name="Nilai Transaksi (GMV)"
                                    fill="#D97706" // Amber 600
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Pendapatan Komisi"
                                    stroke="#10b981" // Emerald 500
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Komoditas teratas */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <PackageSearch className="text-amber-600" size={20} />
                        <h3 className="font-display text-lg font-bold text-slate-900">
                            Volume Komoditas Teratas
                        </h3>
                    </div>

                    {loading ? (
                        <Skeleton count={3} />
                    ) : (stats?.topCommodities.length ?? 0) === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                            <p className="text-sm text-slate-500">Belum ada transaksi lunas untuk dianalisis.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats?.topCommodities.map((c) => {
                                const max = stats.topCommodities[0].value || 1;
                                return (
                                    <div key={c.name} className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                                        <div className="mb-2 flex justify-between text-sm">
                                            <span className="font-bold text-slate-800">{c.name}</span>
                                            <span className="font-extrabold text-amber-600">
                                                {formatRupiah(c.value)}
                                            </span>
                                        </div>
                                        <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                                                style={{ width: `${Math.max((c.value / max) * 100, 4)}%` }}
                                            />
                                        </div>
                                        <div className="mt-2 text-xs font-medium text-slate-500">
                                            Total <strong className="text-slate-700">{formatNumber(c.quantity)} {c.unit}</strong> disalurkan
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Transaksi terbaru */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <ListOrdered className="text-amber-600" size={20} />
                        <h3 className="font-display text-lg font-bold text-slate-900">Monitor Transaksi</h3>
                    </div>

                    {loading ? (
                        <Skeleton count={4} />
                    ) : (stats?.recentTransactions.length ?? 0) === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                            <p className="text-sm text-slate-500">Belum ada transaksi tercatat di database.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats?.recentTransactions.map((t) => (
                                <div
                                    key={t.id}
                                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 transition hover:border-slate-200 hover:shadow-sm"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate font-bold text-slate-900 text-sm">
                                            {t.umkm}
                                        </div>
                                        <div className="truncate text-xs text-slate-500 mt-1">
                                            <span className="font-medium text-slate-700">{t.product}</span> dari {t.supplier}
                                            <span className="mx-1.5 text-slate-300">|</span>
                                            {formatDate(t.createdAt)}
                                        </div>
                                    </div>

                                    <div className="shrink-0 text-right flex flex-col items-end gap-1.5">
                                        <div className="font-extrabold text-slate-900 text-sm">{formatRupiah(t.amount)}</div>
                                        <PaymentBadge status={t.status} />
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
    total,
}: {
    label: string;
    value: number;
    hint?: string;
    bold?: boolean;
    total?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div>
                <span className={bold ? (total ? "font-extrabold text-slate-900 uppercase" : "font-bold text-slate-800") : "font-semibold text-slate-600"}>
                    {label}
                </span>
                {hint && <div className="text-[11px] font-medium text-slate-400 mt-0.5">{hint}</div>}
            </div>
            <span
                className={`shrink-0 font-display ${bold ? (total ? "text-xl font-extrabold" : "text-lg font-bold") : "text-sm font-semibold"} ${value < 0 ? "text-red-500" : "text-emerald-600"
                    }`}
            >
                {value < 0 ? `- ${formatRupiah(Math.abs(value))}` : formatRupiah(value)}
            </span>
        </div>
    );
}

function Skeleton({ count }: { count: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
        </div>
    );
}