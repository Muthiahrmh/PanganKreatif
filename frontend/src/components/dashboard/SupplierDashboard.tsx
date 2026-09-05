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
    CheckCircle2,
    Store
} from "lucide-react";
import { StatCard } from "./StatCard";
import { StatusBadge } from "./StatusBadge";
import { WeatherCard } from "./WeatherCard";
import { KartuPanduan } from "./KartuPanduan";
import { GrafikPendapatan } from "./GrafikPendapatan";
import { SectionEyebrow } from "./SectionEyebrow";
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

    const groupName = user?.supplierProfile?.groupName ?? user?.name ?? "Mitra Pemasok";

    const recentContributions = orders
        .flatMap((o) => o.items.map((it) => ({ ...it, product: o.product, order: o })))
        .slice(0, 5);

    const activeOrders = orders.filter((o) => o.status === "open").slice(0, 4);

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

    return (
        <div className="flex flex-col gap-6 md:gap-8 pb-10">
            {/* Kartu Panduan Pemasok - Hijau Daun */}
            <KartuPanduan aksen="#16A34A" />

            {/* Banner Utama Pemasok (Tema Hijau Alam Premium) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C2318] via-[#123E28] to-[#16A34A] p-6 sm:p-8 md:p-10 text-white shadow-xl border border-emerald-900/40">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-10 h-72 w-72 rounded-full bg-green-400/10 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-md border border-white/10 mb-3">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Sisi Pemasok · Hulu
                        </div>
                        <h2 className="font-display text-2xl md:text-4xl font-extrabold tracking-tight">
                            Halo, {groupName} 🌾
                        </h2>
                        <p className="mt-2 text-sm md:text-base text-emerald-100/80 max-w-xl leading-relaxed">
                            Kelola katalog panen, pantau lonjakan permintaan pasar, dan penuhi pesanan grosir UMKM.
                        </p>
                    </div>

                    <Link
                        href="/dashboard/orders"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-[#0C2318] shadow-lg transition-all hover:scale-105 hover:bg-emerald-50 shrink-0"
                    >
                        <Plus size={18} className="text-emerald-700" />
                        Buka Pesanan Kolektif
                    </Link>
                </div>
            </div>

            {/* Peringatan Deadline Jika Ada */}
            {stats && stats.needsAction > 0 && (
                <div className="flex items-start gap-3.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
                    <div className="text-sm">
                        <span className="font-bold text-amber-900">
                            {stats.needsAction} pesanan sudah melewati batas waktu (deadline)
                        </span>
                        <span className="text-amber-800">
                            {" "}tapi statusnya masih terbuka.{" "}
                            <Link href="/dashboard/orders" className="font-bold underline hover:text-amber-950">
                                Tutup sekarang
                            </Link>{" "}
                            agar dapat segera memproses pengiriman.
                        </span>
                    </div>
                </div>
            )}

            {/* KARTU STATISTIK PEMASOK (Lengkap dengan Satuan) */}
            <div>
            <SectionEyebrow color="text-emerald-700">Statistik Utama</SectionEyebrow>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={ClipboardList}
                    label="Pesanan Terbuka"
                    value={loading ? "..." : `${stats?.openOrders ?? 0} pesanan`}
                    sub={`${stats?.deliveredOrders ?? 0} pesanan terkirim`}
                    color="text-emerald-700"
                />

                <StatCard
                    icon={Package}
                    label="Produk Aktif"
                    value={loading ? "..." : `${stats?.totalProducts ?? 0} komoditas`}
                    sub={
                        stats?.lowStock.length
                            ? `${stats.lowStock.length} stok menipis`
                            : "Stok aman terkendali"
                    }
                    color="text-emerald-700"
                />

                <StatCard
                    icon={Users}
                    label="UMKM Terjangkau"
                    value={loading ? "..." : `${stats?.umkmReached ?? 0} mitra`}
                    sub="Pernah memesan darimu"
                    color="text-blue-600"
                />

                <StatCard
                    icon={TrendingUp}
                    label="Pendapatan Bulan Ini"
                    value={loading ? "..." : formatRupiahShort(stats?.revenueThisMonth ?? 0)}
                    sub={`${formatNumber(stats?.volumeThisMonth ?? 0)} unit tersalurkan`}
                    color="text-amber-600"
                />
            </div>
            </div>

            <div>
                <SectionEyebrow color="text-emerald-700">Pendapatan & Cuaca</SectionEyebrow>
                <div className="flex flex-col gap-6">
                    <GrafikPendapatan />
                    <WeatherCard peran="supplier" />
                </div>
            </div>

            {/* SEKSI: Permintaan Pasar & Pesanan Masuk */}
            <div>
            <SectionEyebrow color="text-emerald-700">Permintaan & Pesanan Masuk</SectionEyebrow>
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Permintaan Pasar */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-bold text-slate-900">
                            Permintaan Bahan Baku
                        </h3>
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            90 hari terakhir
                        </span>
                    </div>

                    {loading ? (
                        <SkeletonRows count={4} />
                    ) : demand && demand.topCommodities.length > 0 ? (
                        <div className="mt-6 space-y-5">
                            {demand.topCommodities.slice(0, 5).map((c) => {
                                const max = demand.topCommodities[0].totalQuantity || 1;
                                const width = Math.max((c.totalQuantity / max) * 100, 4);

                                return (
                                    <div key={`${c.name}-${c.unit}`} className="rounded-xl bg-slate-50/70 p-3.5 border border-slate-100">
                                        <div className="mb-2 flex items-baseline justify-between gap-2 text-sm">
                                            <span className="font-bold text-slate-800 flex items-center gap-2">
                                                {c.name}
                                                {!c.suppliedByMe && (
                                                    <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                                        belum kamu pasok
                                                    </span>
                                                )}
                                            </span>
                                            <span className="shrink-0 font-extrabold text-emerald-700">
                                                {formatNumber(c.totalQuantity)} {c.unit}
                                            </span>
                                        </div>

                                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                                            <div
                                                className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-500"
                                                style={{ width: `${width}%` }}
                                            />
                                        </div>

                                        <div className="mt-2 text-xs font-medium text-slate-500 flex items-center gap-1">
                                            <Store size={13} className="text-slate-400" />
                                            Dibutuhkan oleh <strong className="text-slate-700">{c.umkmCount} UMKM</strong>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyNote>
                            Belum ada permintaan tercatat. Data muncul setelah UMKM mulai bergabung ke pesanan kolektif.
                        </EmptyNote>
                    )}
                </div>

                {/* Pesanan Masuk Terbaru */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <h3 className="font-display text-lg font-bold text-slate-900">
                                Pesanan Masuk Terbaru
                            </h3>
                            <Link
                                href="/dashboard/orders"
                                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                            >
                                Lihat semua <ArrowUpRight size={13} />
                            </Link>
                        </div>

                        {loading ? (
                            <SkeletonRows count={3} />
                        ) : recentContributions.length > 0 ? (
                            <div className="mt-6 space-y-3.5">
                                {recentContributions.map((it) => (
                                    <div
                                        key={it.id}
                                        className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:border-slate-200"
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-bold text-slate-800">
                                                {it.umkm.businessName}
                                            </div>
                                            <div className="truncate text-xs text-slate-500 mt-0.5">
                                                {it.product.name} · {it.umkm.city}
                                            </div>
                                        </div>

                                        <div className="shrink-0 text-right">
                                            <div className="text-sm font-extrabold text-slate-900">
                                                {formatNumber(it.quantity)} {it.product.unit}
                                            </div>
                                            <div className="text-xs font-medium mt-0.5">
                                                {it.status === "paid" ? (
                                                    <span className="text-emerald-600 font-semibold">✓ Lunas</span>
                                                ) : (
                                                    <span className="text-amber-600 font-semibold">Menunggu bayar</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyNote>
                                Belum ada UMKM yang bergabung. Buka pesanan kolektif dulu supaya mereka bisa ikut memesan.
                            </EmptyNote>
                        )}
                    </div>
                </div>
            </div>
            </div>

            {/* SEKSI: Pesanan Aktif & Peluang Pasokan */}
            <div>
            <SectionEyebrow color="text-emerald-700">Pesanan Aktif & Peluang Pasokan</SectionEyebrow>
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Pesanan Aktif */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                    <h3 className="font-display text-lg font-bold text-slate-900">Pesanan Aktif Berjalan</h3>

                    {loading ? (
                        <SkeletonRows count={2} />
                    ) : activeOrders.length > 0 ? (
                        <div className="mt-6 space-y-3">
                            {activeOrders.map((o) => (
                                <Link
                                    key={o.id}
                                    href="/dashboard/orders"
                                    className="block rounded-2xl border border-slate-200 p-4 transition-all hover:border-emerald-500 hover:shadow-md hover:bg-emerald-50/30"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="truncate font-bold text-slate-900">
                                                {o.product.name}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {o.participantCount} UMKM bergabung · {relativeDeadline(o.deadline)}
                                            </div>
                                        </div>
                                        <StatusBadge status={o.status} />
                                    </div>

                                    <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-3 text-sm">
                                        <span className="font-extrabold text-emerald-700">
                                            {formatNumber(o.totalQuantity)} {o.product.unit}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-500">
                                            Est. Nilai: {formatRupiahShort(o.estimatedValue)}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyNote>
                            Belum ada pesanan kolektif yang terbuka.{" "}
                            <Link href="/dashboard/orders" className="font-bold text-emerald-700 underline">
                                Buka satu sekarang
                            </Link>
                            .
                        </EmptyNote>
                    )}
                </div>

                {/* Peluang Pasokan */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-display text-lg font-bold text-slate-900">Peluang Komoditas Baru</h3>

                        {loading ? (
                            <SkeletonRows count={2} />
                        ) : demand && demand.opportunities.length > 0 ? (
                            <>
                                <p className="mt-2 text-xs md:text-sm text-slate-500">
                                    Komoditas ini paling sering dicari UMKM kuliner tetapi belum tersedia di katalog tokomu.
                                </p>

                                <div className="mt-4 space-y-2">
                                    {demand.opportunities.map((c) => (
                                        <div
                                            key={`${c.name}-${c.unit}`}
                                            className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm border border-slate-100"
                                        >
                                            <span className="font-semibold text-slate-800">{c.name}</span>
                                            <span className="font-bold text-emerald-700">
                                                {formatNumber(c.totalQuantity)} {c.unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <Link
                                    href="/dashboard/products"
                                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 border border-emerald-200 transition hover:bg-emerald-100"
                                >
                                    <Lightbulb size={16} className="shrink-0 text-emerald-600" />
                                    Tambahkan ke katalog sekarang
                                </Link>
                            </>
                        ) : (
                            <EmptyNote>
                                Katalogmu sudah memenuhi komoditas yang paling dicari. Terus pantau halaman ini saat permintaan berubah.
                            </EmptyNote>
                        )}
                    </div>

                    {!loading && stats && stats.lowStock.length > 0 && (
                        <div className="mt-6 border-t border-slate-100 pt-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Peringatan Stok Menipis</h4>
                            <div className="mt-2.5 space-y-2">
                                {stats.lowStock.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-amber-50 border border-amber-100"
                                    >
                                        <span className="font-bold text-amber-900">{p.name}</span>
                                        <span className="font-extrabold text-amber-700">
                                            Sisa {formatNumber(p.stock)} {p.unit}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
    return <p className="mt-4 text-xs md:text-sm text-slate-500 leading-relaxed">{children}</p>;
}

function SkeletonRows({ count }: { count: number }) {
    return (
        <div className="mt-5 space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
        </div>
    );
}