"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import type { SalesRecord, ForecastResult, ForecastDetail } from "@/types/dashboard";
import { ForecastChart } from "@/components/dashboard/ForecastChart";

export default function ForecastPage() {
    const [productOptions, setProductOptions] = useState<string[]>([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ForecastDetail | null>(null);
    const [history, setHistory] = useState<ForecastResult[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        api.get<SalesRecord[]>("/sales-records").then((res) => {
            const unique = Array.from(new Set(res.data.map((r) => r.productName)));
            setProductOptions(unique);
            if (unique.length > 0) setSelectedProduct(unique[0]);
        });
        loadHistory();
    }, []);

    async function loadHistory() {
        setLoadingHistory(true);
        try {
            const res = await api.get<ForecastResult[]>("/forecasts");
            setHistory(res.data);
        } finally {
            setLoadingHistory(false);
        }
    }

    async function handleGenerate() {
        if (!selectedProduct) return;
        setError(null);
        setGenerating(true);
        setResult(null);
        try {
            const res = await api.post<ForecastDetail>("/forecasts/generate", {
                productName: selectedProduct,
            });
            setResult(res.data);
            loadHistory();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setGenerating(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Form generate */}
            <div className="rounded-xl border border-ink/5 bg-white p-5">
                <h3 className="font-display text-sm font-bold text-ink">Buat Prediksi Baru</h3>
                <p className="mt-1 text-xs text-ink-soft">
                    Pilih bahan baku yang udah punya histori penjualan, AI bakal prediksi kebutuhan
                    bulan depan.
                </p>

                {productOptions.length === 0 ? (
                    <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        Belum ada data penjualan. Catat dulu di halaman{" "}
                        <a href="/dashboard/sales" className="font-semibold underline">
                            Riwayat Penjualan
                        </a>{" "}
                        sebelum bisa bikin prediksi.
                    </p>
                ) : (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex flex-1 flex-col gap-1.5">
                            <label className="text-sm font-medium text-ink">Bahan baku</label>
                            <select
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                className="rounded-xl border border-ink/15 px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-blue"
                            >
                                {productOptions.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button onClick={handleGenerate} loading={generating} className="sm:w-52">
                            <Sparkles size={15} /> Buat Prediksi
                        </Button>
                    </div>
                )}

                {error && (
                    <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
                )}

                {result && (
                    <div className="mt-5 rounded-xl bg-gradient-to-br from-brand-blue to-brand-green p-5 text-white">
                        <div className="text-xs font-medium text-white/80">
                            Prediksi kebutuhan {result.forecast.productName}
                        </div>
                        <div className="mt-1 font-display text-3xl font-bold">
                            {result.forecast.predictedQuantity}
                        </div>
                        <div className="text-xs text-white/80">
                            untuk periode{" "}
                            {new Date(result.forecast.period).toLocaleDateString("id-ID", {
                                month: "long",
                                year: "numeric",
                            })}
                        </div>

                        <div className="mt-4 rounded-xl bg-white p-3 text-black">
                            <ForecastChart data={result.detail.monthlyTotals} />
                        </div>

                        {result.detail.monthlyTotals.length > 0 && (
                            <div className="mt-4 border-t border-white/20 pt-3">
                                <div className="text-xs font-medium text-white/80">Histori bulanan dipakai:</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {result.detail.monthlyTotals.map((m) => (
                                        <span
                                            key={m.periodKey}
                                            className="rounded-full bg-white/15 px-2.5 py-1 text-xs"
                                        >
                                            {m.periodKey}: {m.quantity}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Riwayat prediksi */}
            <div className="rounded-xl border border-ink/5 bg-white p-5">
                <h3 className="font-display text-sm font-bold text-ink">Riwayat Prediksi</h3>

                {loadingHistory ? (
                    <p className="mt-4 text-sm text-ink-soft">Memuat data...</p>
                ) : history.length === 0 ? (
                    <p className="mt-4 text-sm text-ink-soft">Belum ada prediksi yang dibuat.</p>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-ink/10 text-xs text-ink-soft">
                                    <th className="pb-2 font-medium">Bahan Baku</th>
                                    <th className="pb-2 font-medium">Prediksi</th>
                                    <th className="pb-2 font-medium">Periode</th>
                                    <th className="pb-2 font-medium">Dibuat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((f) => (
                                    <tr key={f.id} className="border-b border-ink/5 last:border-0">
                                        <td className="py-2.5 font-medium text-ink">{f.productName}</td>
                                        <td className="py-2.5 text-brand-green font-semibold">
                                            {f.predictedQuantity}
                                        </td>
                                        <td className="py-2.5 text-ink-soft">
                                            {new Date(f.period).toLocaleDateString("id-ID", {
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="py-2.5 text-ink-soft">
                                            {new Date(f.createdAt).toLocaleDateString("id-ID")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
