"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    NotebookPen,
    Sparkles,
    ShoppingCart,
    PiggyBank,
    ArrowUpRight,
    ArrowDownRight,
    ArrowRight,
    CheckCircle2,
    Activity
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { StatCard } from "@/components/dashboard/StatCard";
import { SectionEyebrow } from "@/components/dashboard/SectionEyebrow";
import { WeatherCard } from "@/components/dashboard/WeatherCard";
import { KartuRekomendasi } from "@/components/dashboard/KartuRekomendasi";
import { KartuPanduan } from "@/components/dashboard/KartuPanduan";
import { ForecastChart } from "@/components/dashboard/ForecastChart";
import type { SalesRecord, ForecastResult, ProcurementOrderItem } from "@/types/dashboard";
import type { UmkmTransaction } from "@/types/transaction";
import { formatRupiah } from "@/lib/format";

export function UmkmDashboardHome() {
    const user = useAuthStore((s) => s.user);
    const [salesCount, setSalesCount] = useState<number | null>(null);
    const [productCount, setProductCount] = useState<number | null>(null);
    const [latestForecast, setLatestForecast] = useState<ForecastResult | null>(null);
    const [activeItems, setActiveItems] = useState<number | null>(null);
    const [totalHemat, setTotalHemat] = useState<number | null>(null);
    const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);

    useEffect(() => {
        if (user?.role !== "umkm") return;

        api
            .get<SalesRecord[]>("/sales-records")
            .then((res) => {
                setSalesCount(res.data.length);
                setProductCount(new Set(res.data.map((r) => r.productName)).size);
                setSalesRecords(res.data);
            })
            .catch(() => {
                setSalesCount(0);
                setProductCount(0);
            });

        api
            .get<ForecastResult[]>("/forecasts")
            .then((res) => setLatestForecast(res.data[0] ?? null))
            .catch(() => setLatestForecast(null));

        api
            .get<ProcurementOrderItem[]>("/procurement/items/mine")
            .then((res) =>
                setActiveItems(res.data.filter((i) => i.status === "pending").length)
            )
            .catch(() => setActiveItems(0));

        api
            .get<UmkmTransaction[]>("/procurement/transactions/mine")
            .then((res) =>
                setTotalHemat(
                    res.data
                        .filter((t) => t.status === "success")
                        .reduce((sum, t) => sum + t.saving, 0)
                )
            )
            .catch(() => setTotalHemat(0));
    }, [user]);

    const arahTren = useMemo(() => {
        if (!latestForecast || salesRecords.length === 0) return null;

        const rows = salesRecords.filter(
            (r) => r.productName === latestForecast.productName
        );
        if (rows.length === 0) return null;

        const perBulan = new Map<string, number>();
        for (const r of rows) {
            const d = new Date(r.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            perBulan.set(key, (perBulan.get(key) ?? 0) + Number(r.quantity));
        }

        const urut = [...perBulan.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, v]) => v);

        const terakhir = urut.slice(-3);
        if (terakhir.length === 0) return null;

        const rata = terakhir.reduce((a, b) => a + b, 0) / terakhir.length;
        const prediksi = Number(latestForecast.predictedQuantity);
        const selisihPersen = rata > 0 ? ((prediksi - rata) / rata) * 100 : 0;

        return {
            rata: Math.round(rata * 10) / 10,
            persen: Math.abs(Math.round(selisihPersen)),
            arah:
                Math.abs(selisihPersen) < 5
                    ? ("stabil" as const)
                    : selisihPersen > 0
                        ? ("naik" as const)
                        : ("turun" as const),
        };
    }, [latestForecast, salesRecords]);

    if (!user) return null;

    return (
        <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 pb-10">
            <KartuPanduan aksen="#2563EB" />

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
                <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 mb-3 border border-blue-200 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                        </span>
                        Sisi Pembeli · Hilir
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                        Halo, {user.umkmProfile?.businessName ?? user.name} 👋
                    </h2>
                    <p className="mt-1.5 text-sm md:text-base text-slate-500">
                        Ini ringkasan aktivitas dan intelijen bisnismu hari ini.
                    </p>
                </div>
            </div>

            {/* KARTU AI INSIGHT */}
            <div className="relative overflow-hidden rounded-3xl bg-[#0B1220] p-6 sm:p-8 md:p-10 text-white shadow-2xl shadow-blue-900/10 border border-slate-800">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-10 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-200 backdrop-blur-md border border-white/5">
                            <Sparkles size={14} className="text-blue-300" />
                            AI Insight & Forecast
                        </div>

                        {latestForecast ? (
                            <>
                                <h3 className="mt-5 font-display text-3xl md:text-5xl font-extrabold tracking-tight">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                                        {latestForecast.predictedQuantity} kg
                                    </span>{" "}
                                    {latestForecast.productName}
                                </h3>

                                <div className="mt-4 text-[14px] md:text-base leading-relaxed text-slate-300">
                                    Berdasarkan histori penjualan, kebutuhan{" "}
                                    <span className="font-semibold text-white">
                                        {latestForecast.productName}
                                    </span>{" "}
                                    {arahTren?.arah === "naik" && (
                                        <>
                                            diperkirakan{" "}
                                            <span className="inline-flex items-center gap-1 font-semibold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/30 mx-1">
                                                <ArrowUpRight size={14} /> naik {arahTren.persen}%
                                            </span>
                                            dibanding rata-rata tiga bulan terakhir (
                                            {arahTren.rata}). Disarankan menyiapkan stok lebih
                                            awal atau bergabung dalam belanja kolektif supaya
                                            dapat harga grosir.
                                        </>
                                    )}
                                    {arahTren?.arah === "turun" && (
                                        <>
                                            diperkirakan{" "}
                                            <span className="inline-flex items-center gap-1 font-semibold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 mx-1">
                                                <ArrowDownRight size={14} /> turun {arahTren.persen}%
                                            </span>
                                            dibanding rata-rata tiga bulan terakhir (
                                            {arahTren.rata}). Kurangi pembelian supaya tidak
                                            ada stok berlebih yang terbuang.
                                        </>
                                    )}
                                    {arahTren?.arah === "stabil" && (
                                        <>
                                            diperkirakan{" "}
                                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30 mx-1">
                                                <ArrowRight size={14} /> relatif stabil
                                            </span>
                                            dibanding rata-rata tiga bulan terakhir (
                                            {arahTren.rata}). Pertahankan pola pembelian dan
                                            manfaatkan belanja kolektif untuk menekan biaya.
                                        </>
                                    )}
                                    {!arahTren && (
                                        <>
                                            diperkirakan sebesar{" "}
                                            <span className="text-white font-medium">{latestForecast.predictedQuantity} kg</span> pada periode
                                            berikutnya.
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="mt-5 font-display text-2xl md:text-3xl font-bold text-white">
                                    Sistem Sedang Mempelajari Data...
                                </h3>
                                <p className="mt-3 text-[14px] md:text-base text-slate-400">
                                    Tambahkan data penjualan historis dan buat prediksi pertama
                                    untuk mengaktifkan asisten AI PanganKreatif.
                                </p>
                            </>
                        )}
                    </div>

                    <Link
                        href="/dashboard/forecast"
                        aria-label="Buka halaman Prediksi AI"
                        className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/10 text-white/80 transition-all hover:bg-blue-600 hover:text-white hover:scale-110 hover:border-blue-500 shadow-lg"
                    >
                        <ArrowUpRight size={20} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                </div>
            </div>

            {/* KARTU STATISTIK — pakai komponen StatCard bersama, konsisten
                dengan dashboard Tani & Admin */}
            <div className="mt-2">
                <SectionEyebrow color="text-blue-600">Statistik Utama</SectionEyebrow>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    <StatCard
                        icon={NotebookPen}
                        label="Data Penjualan"
                        value={salesCount === null ? "..." : `${salesCount} catatan`}
                        sub={`${productCount ?? 0} bahan baku terdata`}
                        color="text-blue-600"
                    />
                    <StatCard
                        icon={Sparkles}
                        label="Forecast Bulan Depan"
                        value={latestForecast ? `${latestForecast.predictedQuantity} kg` : "-"}
                        sub={latestForecast ? latestForecast.productName : "Belum tersedia"}
                        color="text-blue-600"
                    />
                    <StatCard
                        icon={ShoppingCart}
                        label="Pesanan Aktif"
                        value={activeItems === null ? "..." : `${activeItems} pesanan`}
                        sub="Dalam proses kolektif"
                        color="text-blue-600"
                    />
                    <StatCard
                        icon={PiggyBank}
                        label="Hemat Belanja Kolektif"
                        value={totalHemat === null ? "..." : formatRupiah(totalHemat)}
                        sub={totalHemat && totalHemat > 0 ? "Dibanding harga satuan" : "Gabung buat harga grosir"}
                        color="text-emerald-600"
                    />
                </div>
            </div>

            <div>
                <SectionEyebrow color="text-blue-600">Rekomendasi & Cuaca</SectionEyebrow>
                <div className="flex flex-col gap-6">
                    <KartuRekomendasi />
                    <WeatherCard peran="umkm" />
                </div>
            </div>

            {/* SEKSI BAWAH */}
            <div>
                <SectionEyebrow color="text-blue-600">Detail Prediksi & Status</SectionEyebrow>
                <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display text-lg font-bold text-slate-900">
                            Grafik Forecast Terakhir
                        </h3>
                        <Activity className="text-blue-500" size={20} />
                    </div>

                    {latestForecast ? (
                        <div className="flex-1 flex flex-col md:flex-row gap-8">
                            <div className="w-full md:w-56 shrink-0 rounded-2xl bg-gradient-to-b from-blue-50 to-white p-6 border border-blue-100 flex flex-col justify-center text-center md:text-left">
                                <div className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
                                    Proyeksi
                                </div>
                                <div className="text-4xl font-extrabold text-slate-900">
                                    {latestForecast.predictedQuantity} <span className="text-lg font-medium text-slate-500">kg</span>
                                </div>
                                <div className="mt-2 text-base font-medium text-slate-800">
                                    {latestForecast.productName}
                                </div>
                                <div className="mt-4 pt-4 border-t border-blue-100/50">
                                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm border border-slate-200">
                                        🗓️ {new Date(latestForecast.period).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                                    </div>
                                </div>
                            </div>

                            <div className="h-64 flex-1">
                                <ForecastChart
                                    data={[
                                        { periodKey: "Jan", quantity: 20 },
                                        { periodKey: "Feb", quantity: 25 },
                                        { periodKey: "Mar", quantity: 30 },
                                        { periodKey: "Apr", quantity: 35 },
                                        { periodKey: "Mei", quantity: 42 },
                                        { periodKey: "Jun", quantity: 48 },
                                    ]}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center p-8">
                            <p className="text-sm text-slate-500">Belum ada data grafik prediksi.</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-6">
                    <div className="rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white p-6 shadow-sm flex-1">
                        <h3 className="font-display text-lg font-bold text-slate-900 mb-6">
                            Status Sistem
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                                <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                                <span className="text-sm font-medium text-slate-700">Forecast AI Aktif</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                                <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                                <span className="text-sm font-medium text-slate-700">Belanja Kolektif Aktif</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                                <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                                <span className="text-sm font-medium text-slate-700">Data Tersinkronisasi</span>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>

            {/* QUICK LINKS BOTTOM */}
            <div>
                <SectionEyebrow color="text-blue-600">Aksi Cepat</SectionEyebrow>
                <div className="grid gap-4 sm:grid-cols-3">
                    <Link
                        href="/dashboard/sales"
                        className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1"
                    >
                        <div>
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                                <NotebookPen size={22} />
                            </span>
                            <h3 className="mt-4 font-display text-base font-bold text-slate-900">Catat Penjualan</h3>
                            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                                Input histori penjualan harian buat bahan training AI prediksi.
                            </p>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/forecast"
                        className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1"
                    >
                        <div>
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                                <Sparkles size={22} />
                            </span>
                            <h3 className="mt-4 font-display text-base font-bold text-slate-900">Buat Prediksi</h3>
                            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                                Lihat perkiraan kebutuhan bahan baku bulan depan dengan presisi AI.
                            </p>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/procurement"
                        className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1"
                    >
                        <div>
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                                <ShoppingCart size={22} />
                            </span>
                            <h3 className="mt-4 font-display text-base font-bold text-slate-900">Belanja Kolektif</h3>
                            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                                Gabung pesanan bareng UMKM lain buat tebus harga grosir termurah.
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}