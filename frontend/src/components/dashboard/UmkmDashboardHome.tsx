"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NotebookPen, Sparkles, ShoppingCart, PiggyBank, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { StatCard } from "@/components/dashboard/StatCard";
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

    useEffect(() => {
        if (user?.role !== "umkm") return;

        api.get<SalesRecord[]>("/sales-records").then((res) => {
            setSalesCount(res.data.length);
            setProductCount(new Set(res.data.map((r) => r.productName)).size);
        });

        api.get<ForecastResult[]>("/forecasts").then((res) => {
            setLatestForecast(res.data[0] ?? null);
        });

        api.get<ProcurementOrderItem[]>("/procurement/items/mine").then((res) => {
            setActiveItems(res.data.filter((i) => i.status === "pending").length);
        });

        // Total rupiah yang dihemat berkat belanja kolektif
        api.get<UmkmTransaction[]>("/procurement/transactions/mine").then((res) => {
            setTotalHemat(
                res.data
                    .filter((t) => t.status === "success")
                    .reduce((sum, t) => sum + t.saving, 0)
            );
        });
    }, [user]);

    if (!user) return null;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display text-xl font-bold text-ink">
                    Halo, {user.umkmProfile?.businessName ?? user.name} 👋
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                    Ini ringkasan aktivitas bisnis kamu di PanganKreatif.
                </p>
            </div>

            <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-brand-blue to-brand-green p-6 text-white shadow-lg">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-sm font-medium text-white/80">
                            🧠 AI Insight
                        </div>

                        {latestForecast ? (
                            <>
                                <h3 className="mt-2 font-display text-2xl font-bold">
                                    {latestForecast.predictedQuantity} {""}
                                    {latestForecast.productName}
                                </h3>

                                <p className="mt-2 max-w-xl text-sm text-white/90">
                                    Berdasarkan histori penjualan, kebutuhan{" "}
                                    <span className="font-semibold">
                                        {latestForecast.productName}
                                    </span>{" "}
                                    diperkirakan meningkat pada periode berikutnya.
                                    Disarankan menyiapkan stok lebih awal atau bergabung
                                    dalam belanja kolektif.
                                </p>
                            </>
                        ) : (
                            <>
                                <h3 className="mt-2 font-display text-2xl font-bold">
                                    Belum Ada Prediksi
                                </h3>

                                <p className="mt-2 text-sm text-white/90">
                                    Tambahkan data penjualan dan buat prediksi pertama
                                    untuk mendapatkan rekomendasi AI.
                                </p>
                            </>
                        )}
                    </div>

                    <ArrowUpRight size={28} className="text-white/80" />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={NotebookPen}
                    label="Data Penjualan"
                    value={salesCount === null ? "..." : String(salesCount)}
                    sub={`${productCount ?? 0} bahan baku terdata`}
                />

                <StatCard
                    icon={Sparkles}
                    label="Forecast Bulan Depan"
                    value={
                        latestForecast
                            ? `${latestForecast.predictedQuantity} Kg`
                            : "-"
                    }
                    sub={
                        latestForecast
                            ? latestForecast.productName
                            : "Belum tersedia"
                    }
                    color="text-brand-green"
                />

                <StatCard
                    icon={ShoppingCart}
                    label="Pesanan Aktif"
                    value={activeItems === null ? "..." : String(activeItems)}
                    sub="Dalam proses kolektif"
                    color="text-brand-blue"
                />

                <StatCard
                    icon={PiggyBank}
                    label="Hemat Belanja Kolektif"
                    value={totalHemat === null ? "..." : formatRupiah(totalHemat)}
                    sub={
                        totalHemat && totalHemat > 0
                            ? "Dibanding harga satuan"
                            : "Gabung kolektif buat harga grosir"
                    }
                    color="text-amber-500"
                />
            </div>

            <div className="rounded-xl border border-ink/5 bg-white p-5">
                <h3 className="font-display text-lg font-bold text-ink">
                    Forecast Terakhir
                </h3>

                {latestForecast ? (
                    <div className="mt-4">
                        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
                            <div>
                                <div className="text-3xl font-bold text-brand-green">
                                    {latestForecast.predictedQuantity} kg
                                </div>

                                <div className="mt-2 font-medium text-ink">
                                    {latestForecast.productName}
                                </div>

                                <div className="mt-1 text-sm text-ink-soft">
                                    {new Date(latestForecast.period).toLocaleDateString(
                                        "id-ID",
                                        {
                                            month: "long",
                                            year: "numeric",
                                        }
                                    )}
                                </div>
                            </div>

                            <div className="h-64">
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
                    </div>
                ) : (
                    <p className="mt-4 text-sm text-ink-soft">
                        Belum ada prediksi.
                    </p>
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm">
                    <h3 className="font-display text-lg font-bold text-ink">
                        Insight AI
                    </h3>

                    <p className="mt-3 text-sm text-ink-soft">
                        {latestForecast
                            ? `Permintaan ${latestForecast.productName} diperkirakan mencapai ${latestForecast.predictedQuantity} kg pada periode berikutnya.`
                            : "Belum ada data prediksi untuk dianalisis."}
                    </p>

                    <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">
                        💡 Rekomendasi: Siapkan stok lebih awal dan manfaatkan fitur belanja kolektif untuk memperoleh harga grosir yang lebih murah.
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h3 className="font-display text-lg font-bold text-ink">
                        Status Sistem
                    </h3>

                    <div className="mt-4 space-y-3 text-sm">
                        <div>✅ Forecast AI Aktif</div>
                        <div>✅ Belanja Kolektif Aktif</div>
                        <div>✅ Data Tersinkronisasi</div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <Link
                    href="/dashboard/sales"
                    className="rounded-xl border border-ink/5 bg-white p-5 transition-colors hover:border-brand-blue"
                >
                    <NotebookPen className="text-brand-blue" size={20} />
                    <h3 className="mt-3 font-display text-sm font-bold text-ink">Catat Penjualan</h3>
                    <p className="mt-1 text-xs text-ink-soft">
                        Input histori penjualan harian buat bahan training prediksi.
                    </p>
                </Link>
                <Link
                    href="/dashboard/forecast"
                    className="rounded-xl border border-ink/5 bg-white p-5 transition-colors hover:border-brand-green"
                >
                    <Sparkles className="text-brand-green" size={20} />
                    <h3 className="mt-3 font-display text-sm font-bold text-ink">Buat Prediksi</h3>
                    <p className="mt-1 text-xs text-ink-soft">
                        Lihat perkiraan kebutuhan bahan baku bulan depan.
                    </p>
                </Link>
                <Link
                    href="/dashboard/procurement"
                    className="rounded-xl border border-ink/5 bg-white p-5 transition-colors hover:border-brand-blue"
                >
                    <ShoppingCart className="text-brand-blue" size={20} />
                    <h3 className="mt-3 font-display text-sm font-bold text-ink">Belanja Kolektif</h3>
                    <p className="mt-1 text-xs text-ink-soft">
                        Gabung pesanan bareng UMKM lain buat harga grosir.
                    </p>
                </Link>
            </div>
        </div>
    );
}