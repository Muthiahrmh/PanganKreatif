"use client";

import { useEffect, useState } from "react";
import { Sparkles, Info, CloudRain } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import type { SalesRecord, ForecastResult, ForecastDetail } from "@/types/dashboard";
import { ForecastChart } from "@/components/dashboard/ForecastChart";

/** Kolom period bertipe Date UTC, jadi dibaca sebagai UTC supaya bulannya tidak mundur */
function formatPeriode(value: string) {
    return new Date(value).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}

export default function ForecastPage() {
    const [productOptions, setProductOptions] = useState<string[]>([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ForecastDetail | null>(null);
    const [history, setHistory] = useState<ForecastResult[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        api
            .get<SalesRecord[]>("/sales-records")
            .then((res) => {
                const unique = Array.from(new Set(res.data.map((r) => r.productName)));
                setProductOptions(unique);
                if (unique.length > 0) setSelectedProduct(unique[0]);
            })
            .catch(() => setProductOptions([]));
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
                            untuk periode {formatPeriode(result.forecast.period)}
                        </div>

                        <div className="mt-4 rounded-xl bg-white p-3 text-black">
                            <ForecastChart data={result.detail.monthlyTotals} />
                        </div>

                        {result.detail.monthlyTotals.length > 0 && (
                            <div className="mt-4 border-t border-white/20 pt-3">
                                <div className="text-xs font-medium text-white/80">
                                    Histori bulanan dipakai:
                                </div>
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

                {result && (result.bufferPersen ?? 0) > 0 && (
                    <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-800">
                        <CloudRain size={16} className="mt-0.5 shrink-0" />
                        <div>
                            <span className="font-semibold">
                                Cuaca {result.cuaca?.kota ?? "wilayahmu"} berisiko dalam beberapa hari
                                ke depan.
                            </span>{" "}
                            {result.cuaca?.peringatan?.pesan}{" "}
                            Disarankan tambah buffer {result.bufferPersen}% jadi sekitar{" "}
                            <span className="font-semibold">{result.jumlahDenganBuffer}</span> —
                            angka prediksi AI di atas tidak berubah, ini cuma saran jaga-jaga kalau
                            pasokan dari pemasok berpotensi telat.
                        </div>
                    </div>
                )}
            </div>

            {/* Cara perhitungan — supaya prediksinya bisa ditelusuri, bukan kotak hitam */}
            {result && (
                <div className="rounded-xl border border-ink/5 bg-white p-5">
                    <div className="flex items-start gap-2">
                        <Info size={16} className="mt-0.5 shrink-0 text-brand-blue" />
                        <div>
                            <h3 className="font-display text-sm font-bold text-ink">
                                Cara Perhitungan
                            </h3>
                            <p className="mt-1 text-xs text-ink-soft">
                                {result.detail.aiApplied
                                    ? "Model hybrid: jaringan saraf tiruan yang dilatih dari histori penjualanmu sendiri, digabung dengan model statistik. Setiap komponen di bawah bisa ditelusuri dari data penjualan yang tercatat."
                                    : "Metode deret waktu statistik. Setiap komponen di bawah bisa ditelusuri dari data penjualan yang tercatat."}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <Komponen
                            label="Rata-rata bergerak"
                            nilai={result.detail.movingAverage}
                            catatan="3 bulan terakhir"
                        />
                        <Komponen
                            label="Proyeksi tren linear"
                            nilai={result.detail.linearTrend}
                            catatan="regresi kuadrat terkecil"
                        />
                        <Komponen
                            label="Faktor musiman"
                            nilai={result.detail.seasonalFactor}
                            catatan={
                                result.detail.seasonalityApplied
                                    ? "pola bulanan berulang"
                                    : "belum aktif"
                            }
                        />
                        <Komponen
                            label="Faktor hari libur"
                            nilai={result.detail.holidayFactor}
                            catatan={
                                result.detail.holidayApplied
                                    ? result.detail.holidayList?.join(", ") || "hari libur nasional"
                                    : "belum aktif"
                            }
                        />
                        <Komponen
                            label="Model AI (neural network)"
                            nilai={result.detail.aiPrediction ?? undefined}
                            catatan={
                                result.detail.aiApplied
                                    ? `dilatih dari ${result.detail.aiSamples} titik data, bobot ${Math.round(
                                          (result.detail.aiWeight ?? 0) * 100
                                      )}%`
                                    : `belum aktif, butuh minimal 6 bulan data (saat ini ${result.detail.monthsOfData ?? 0})`
                            }
                        />
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-ink-soft">Algoritma:</span>
                            <code className="rounded bg-paper-soft px-2 py-1 font-data text-ink">
                                {result.algoritma}
                            </code>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-ink-soft">Data historis:</span>
                            <span className="font-medium text-ink">
                                {result.detail.monthsOfData ?? 0} bulan
                                {result.detail.lastDataPeriod &&
                                    ` (terakhir ${result.detail.lastDataPeriod})`}
                            </span>
                        </div>
                    </div>

                    {result.detail.holidayNote && (
                        <p className="mt-3 rounded-lg bg-paper-soft px-3 py-2.5 text-xs text-ink-soft">
                            <span className="font-medium text-ink">Hari libur: </span>
                            {result.detail.holidayNote}
                        </p>
                    )}

                    {result.detail.keterangan && (
                        <p
                            className={`mt-4 rounded-lg px-3 py-2.5 text-xs ${result.detail.seasonalityApplied
                                    ? "bg-green-50 text-green-700"
                                    : "bg-amber-50 text-amber-800"
                                }`}
                        >
                            {result.detail.keterangan}
                        </p>
                    )}
                </div>
            )}

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
                                        <td className="py-2.5 font-medium text-ink">
                                            {f.productName}
                                        </td>
                                        <td className="py-2.5 font-semibold text-brand-green">
                                            {f.predictedQuantity}
                                        </td>
                                        <td className="py-2.5 text-ink-soft">
                                            {formatPeriode(f.period)}
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

function Komponen({
    label,
    nilai,
    catatan,
}: {
    label: string;
    nilai?: number;
    catatan: string;
}) {
    return (
        <div className="rounded-lg bg-paper-soft p-3">
            <div className="text-xs text-ink-soft">{label}</div>
            <div className="mt-1 font-display text-lg font-bold text-ink">
                {nilai == null ? "-" : nilai}
            </div>
            <div className="text-xs text-ink-soft">{catatan}</div>
        </div>
    );
}