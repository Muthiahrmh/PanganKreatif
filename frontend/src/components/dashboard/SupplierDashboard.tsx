"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Package,
    ClipboardList,
    TrendingUp,
    Users,
    AlertTriangle,
    Lightbulb,
    ArrowUpRight,
    Plus,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { StatusBadge } from "./StatusBadge";
import { WeatherCard } from "./WeatherCard";
import { KartuPanduan } from "./KartuPanduan";
import { GrafikPendapatan } from "./GrafikPendapatan";
import { useAuthStore } from "@/store/authStore";
import { fetchDemandInsights, fetchMyOrders, fetchSupplierStats } from "@/lib/supplier";
import { getApiErrorMessage } from "@/lib/api";
import { formatNumber, formatRupiahShort, relativeDeadline } from "@/lib/format";
import type { DemandInsights, SupplierOrder, SupplierStats } from "@/types/supplier";

export function SupplierDashboard() {
    const user = useAuthStore((s) => s.user);

    const [stats, setStats] = useState<SupplierStats | null>(null);
    const [orders, setOrders] = useState<SupplierOrder[]>([]);
    const [demand, setDemand] = useState<DemandInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const [s, o, d] = await Promise.all([
                    fetchSupplierStats(),
                    fetchMyOrders(),
                    fetchDemandInsights({ days: 90 }),
                ]);
                if (cancelled) return;
                setStats(s);
                setOrders(o);
                setDemand(d);
                setError(null);
            } catch (err) {
                if (!cancelled) setError(getApiErrorMessage(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const groupName = user?.supplierProfile?.groupName ?? user?.name ?? "Mitra";

    const recentContributions = orders
        .flatMap((o) => o.items.map((it) => ({ ...it, product: o.product, order: o })))
        .slice(0, 5);

    const activeOrders = orders.filter((o) => o.status === "open").slice(0, 4);

    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <h2 className="font-display font-bold text-red-800">Data gagal dimuat</h2>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                    Muat ulang
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#0C2318] to-[#16A34A] p-6 text-white">
                <div>
                    <div className="text-xs font-medium text-white/70">Sisi Pemasok · Hulu</div>
                    <h2 className="mt-1 font-display text-xl font-bold">Halo, {groupName} 🌱</h2>
                    <p className="mt-1 text-sm text-white/85">
                        Kelola katalog bahan baku dan pesanan kolektif dari UMKM kuliner.
                    </p>
                </div>

                <Link
                    href="/dashboard/orders"
                    className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/25 transition hover:bg-white/25"
                >
                    <Plus size={16} /> Buka pesanan kolektif
                </Link>
            </div>

            <KartuPanduan aksen="#16A34A" />

            {stats && stats.needsAction > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                    <div className="text-sm">
                        <span className="font-semibold text-amber-900">
                            {stats.needsAction} pesanan sudah lewat deadline
                        </span>
                        <span className="text-amber-800">
                            {" "}
                            tapi masih terbuka.{" "}
                            <Link href="/dashboard/orders" className="font-medium underline">
                                Tutup sekarang
                            </Link>{" "}
                            supaya bisa lanjut ke pengiriman.
                        </span>
                    </div>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={ClipboardList}
                    label="Pesanan Terbuka"
                    value={loading ? "..." : String(stats?.openOrders ?? 0)}
                    sub={`${stats?.deliveredOrders ?? 0} sudah terkirim`}
                />

                <StatCard
                    icon={Package}
                    label="Produk Aktif"
                    value={loading ? "..." : String(stats?.totalProducts ?? 0)}
                    sub={
                        stats?.lowStock.length
                            ? `${stats.lowStock.length} stok menipis`
                            : "Stok aman"
                    }
                    color="text-brand-green"
                />

                <StatCard
                    icon={Users}
                    label="UMKM Terjangkau"
                    value={loading ? "..." : String(stats?.umkmReached ?? 0)}
                    sub="Pernah pesan darimu"
                    color="text-brand-blue"
                />

                <StatCard
                    icon={TrendingUp}
                    label="Pendapatan Bulan Ini"
                    value={loading ? "..." : formatRupiahShort(stats?.revenueThisMonth ?? 0)}
                    sub={`${formatNumber(stats?.volumeThisMonth ?? 0)} unit tersalur`}
                    color="text-amber-500"
                />
            </div>

            <GrafikPendapatan />

            <WeatherCard peran="supplier" />

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Permintaan pasar */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-bold text-ink">
                            Permintaan Bahan Baku
                        </h3>
                        <span className="text-xs text-ink-soft">90 hari terakhir</span>
                    </div>

                    {loading ? (
                        <SkeletonRows count={4} />
                    ) : demand && demand.topCommodities.length > 0 ? (
                        <div className="mt-5 space-y-4">
                            {demand.topCommodities.slice(0, 5).map((c) => {
                                const max = demand.topCommodities[0].totalQuantity || 1;
                                const width = Math.max((c.totalQuantity / max) * 100, 4);

                                return (
                                    <div key={`${c.name}-${c.unit}`}>
                                        <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                                            <span className="truncate">
                                                {c.name}
                                                {!c.suppliedByMe && (
                                                    <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                                        belum kamu pasok
                                                    </span>
                                                )}
                                            </span>
                                            <span className="shrink-0 font-semibold text-brand-green">
                                                {formatNumber(c.totalQuantity)} {c.unit}
                                            </span>
                                        </div>

                                        <div className="h-2 rounded-full bg-slate-100">
                                            <div
                                                className="h-2 rounded-full bg-brand-green"
                                                style={{ width: `${width}%` }}
                                            />
                                        </div>

                                        <div className="mt-1 text-xs text-ink-soft">
                                            diminta {c.umkmCount} UMKM
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyNote>
                            Belum ada permintaan tercatat. Data muncul setelah UMKM mulai bergabung ke
                            pesanan kolektif.
                        </EmptyNote>
                    )}
                </div>

                {/* Kontribusi UMKM terbaru */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-bold text-ink">
                            Pesanan Masuk Terbaru
                        </h3>
                        <Link
                            href="/dashboard/orders"
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-blue hover:underline"
                        >
                            Lihat semua <ArrowUpRight size={13} />
                        </Link>
                    </div>

                    {loading ? (
                        <SkeletonRows count={3} />
                    ) : recentContributions.length > 0 ? (
                        <div className="mt-4 space-y-3 text-sm">
                            {recentContributions.map((it) => (
                                <div
                                    key={it.id}
                                    className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate font-medium">
                                            {it.umkm.businessName}
                                        </div>
                                        <div className="truncate text-xs text-ink-soft">
                                            {it.product.name} · {it.umkm.city}
                                        </div>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <div className="font-semibold">
                                            {formatNumber(it.quantity)} {it.product.unit}
                                        </div>
                                        <div className="text-xs text-ink-soft">
                                            {it.status === "paid" ? "Sudah bayar" : "Belum bayar"}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyNote>
                            Belum ada UMKM yang bergabung. Buka pesanan kolektif dulu supaya mereka
                            bisa ikut memesan.
                        </EmptyNote>
                    )}
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Pesanan aktif */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h3 className="font-display text-lg font-bold text-ink">Pesanan Aktif</h3>

                    {loading ? (
                        <SkeletonRows count={2} />
                    ) : activeOrders.length > 0 ? (
                        <div className="mt-4 space-y-3">
                            {activeOrders.map((o) => (
                                <Link
                                    key={o.id}
                                    href="/dashboard/orders"
                                    className="block rounded-xl border border-ink/5 p-4 transition-colors hover:border-brand-green"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="truncate font-medium text-ink">
                                                {o.product.name}
                                            </div>
                                            <div className="mt-1 text-xs text-ink-soft">
                                                {o.participantCount} UMKM ·{" "}
                                                {relativeDeadline(o.deadline)}
                                            </div>
                                        </div>
                                        <StatusBadge status={o.status} />
                                    </div>

                                    <div className="mt-3 flex items-baseline justify-between text-sm">
                                        <span className="font-semibold text-brand-green">
                                            {formatNumber(o.totalQuantity)} {o.product.unit}
                                        </span>
                                        <span className="text-ink-soft">
                                            {formatRupiahShort(o.estimatedValue)}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyNote>
                            Belum ada pesanan kolektif yang terbuka.{" "}
                            <Link href="/dashboard/orders" className="font-medium text-brand-blue underline">
                                Buka satu sekarang
                            </Link>
                            .
                        </EmptyNote>
                    )}
                </div>

                {/* Peluang pasar */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h3 className="font-display text-lg font-bold text-ink">Peluang Pasokan</h3>

                    {loading ? (
                        <SkeletonRows count={2} />
                    ) : demand && demand.opportunities.length > 0 ? (
                        <>
                            <p className="mt-3 text-sm text-ink-soft">
                                Komoditas ini banyak dicari UMKM tapi belum ada di katalogmu.
                            </p>

                            <div className="mt-4 space-y-2">
                                {demand.opportunities.map((c) => (
                                    <div
                                        key={`${c.name}-${c.unit}`}
                                        className="flex items-center justify-between rounded-lg bg-paper-soft px-3 py-2 text-sm"
                                    >
                                        <span className="truncate">{c.name}</span>
                                        <span className="shrink-0 font-semibold text-brand-blue">
                                            {formatNumber(c.totalQuantity)} {c.unit}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="/dashboard/products"
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-700 transition hover:bg-green-100"
                            >
                                <Lightbulb size={16} className="shrink-0" />
                                Tambahkan ke katalog untuk menangkap permintaan ini.
                            </Link>
                        </>
                    ) : (
                        <EmptyNote>
                            Katalogmu sudah menutupi komoditas yang paling dicari. Terus pantau
                            halaman ini saat permintaan berubah.
                        </EmptyNote>
                    )}

                    {!loading && stats && stats.lowStock.length > 0 && (
                        <div className="mt-5 border-t border-slate-100 pt-4">
                            <h4 className="text-sm font-semibold text-ink">Stok menipis</h4>
                            <div className="mt-2 space-y-1.5">
                                {stats.lowStock.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span className="truncate">{p.name}</span>
                                        <span className="shrink-0 font-medium text-amber-600">
                                            sisa {formatNumber(p.stock)} {p.unit}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
    return <p className="mt-4 text-sm text-ink-soft">{children}</p>;
}

function SkeletonRows({ count }: { count: number }) {
    return (
        <div className="mt-5 space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
            ))}
        </div>
    );
}