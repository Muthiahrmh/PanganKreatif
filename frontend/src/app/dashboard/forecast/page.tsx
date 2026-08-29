"use client";

import { useEffect, useState, useMemo } from "react";
import { Sparkles, Info, CloudRain, History, ChevronLeft, ChevronRight, ChevronDown, BrainCircuit, ArrowRight, Package, TrendingUp, Calendar, Target, Activity } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import type { SalesRecord, ForecastResult, ForecastDetail } from "@/types/dashboard";
import { ForecastChart } from "@/components/dashboard/ForecastChart";

function formatPeriode(value: string) {
    return new Date(value).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}

function formatAlgorithmName(algo?: string) {
    if (!algo) return "AI Standar";
    return algo
        .replace(/moving_average/g, "Rata-rata Histori")
        .replace(/linear_trend/g, "Tren Proyeksi")
        .replace(/seasonal/g, "Pola Musiman")
        .replace(/\+/g, " + ");
}

// 100% Sinkron dengan Seed Database PanganKreatif
function getExactUnit(productName: string, records: any[]) {
    const record = records.find(r => r.productName === productName);
    if (record && record.unit) return record.unit;

    const name = (productName || "").trim();
    const liters = ["Minyak Goreng", "Kecap Manis", "Minyak Kelapa", "Saus Tomat", "Santan Kelapa"];
    if (liters.includes(name)) return "liter";
    const ikats = ["Bayam", "Kangkung"];
    if (ikats.includes(name)) return "ikat";

    return "kg";
}

const ITEMS_PER_PAGE = 5;

export default function ForecastPage() {
    const [records, setRecords] = useState<SalesRecord[]>([]);
    const [productOptions, setProductOptions] = useState<string[]>([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ForecastDetail | null>(null);
    const [history, setHistory] = useState<ForecastResult[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        api
            .get<SalesRecord[]>("/sales-records")
            .then((res) => {
                setRecords(res.data);
                const unique = Array.from(new Set(res.data.map((r) => r.productName))).sort();
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
            setCurrentPage(1);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setGenerating(false);
        }
    }

    const currentUnit = useMemo(() => {
        const targetProduct = result?.forecast?.productName || selectedProduct;
        return getExactUnit(targetProduct, records);
    }, [records, result, selectedProduct]);

    const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
    const paginatedHistory = history.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="flex flex-col gap-8 pb-12">

            {/* Header Hero Section */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0B1120] via-[#0f172a] to-[#1e3a8a] p-8 sm:p-10 shadow-2xl shadow-blue-900/20 text-white z-0">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-[80px] pointer-events-none"></div>
                <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-cyan-500/20 blur-[60px] pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-xs font-bold text-blue-300 mb-4 backdrop-blur-md shadow-inner">
                            <BrainCircuit size={14} className="text-cyan-400" /> Didukung Kecerdasan Buatan
                        </div>
                        <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                            Intelijensi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">Stok Pangan</span>
                        </h2>
                        <p className="text-sm sm:text-base font-medium text-slate-300 max-w-xl leading-relaxed">
                            Proyeksikan kebutuhan bahan baku Anda di masa depan dengan akurasi tinggi menggunakan model machine learning kami.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Generate Card */}
            <div className="rounded-[32px] border border-blue-100 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(59,130,246,0.06)] relative z-20 -mt-4">
                <div className="flex items-center gap-4 mb-8">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 shadow-inner border border-blue-200/60">
                        <Target size={26} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="font-display text-xl font-extrabold text-slate-900 tracking-tight">Buat Prediksi Baru</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            Pilih bahan baku untuk memproyeksikan estimasi kebutuhan bulan depan.
                        </p>
                    </div>
                </div>

                {productOptions.length === 0 ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-medium text-amber-800 leading-relaxed">
                        Belum ada data penjualan tercatat. Catat terlebih dahulu di halaman{" "}
                        <a href="/dashboard/sales" className="font-bold text-amber-900 underline decoration-amber-300 underline-offset-4 hover:text-amber-950 transition-colors">
                            Riwayat Penjualan
                        </a>{" "}
                        sebelum dapat menjalankan prediksi AI.
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-5 items-end">
                            <div className="relative w-full sm:w-2/3 lg:w-1/2 z-50">
                                <label className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-blue-600 mb-3">
                                    <Package size={14} /> Bahan Baku Analisis
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className={`flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-[15px] font-bold outline-none transition-all duration-300 ${dropdownOpen
                                            ? "border-blue-500 bg-blue-50/40 text-blue-900 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]"
                                            : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.08)] hover:bg-white"
                                        }`}
                                >
                                    <span className="truncate">{selectedProduct || "Pilih bahan baku..."}</span>
                                    <ChevronDown size={20} className={`shrink-0 text-slate-400 transition-transform duration-300 ${dropdownOpen ? "rotate-180 text-blue-500" : ""}`} />
                                </button>

                                {dropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                                        <div className="absolute left-0 top-[calc(100%+12px)] z-20 w-full max-h-72 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/5 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {productOptions.map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedProduct(p);
                                                        setDropdownOpen(false);
                                                    }}
                                                    className={`w-full rounded-[14px] px-4 py-3.5 text-left text-[15px] font-bold transition-all flex items-center justify-between ${selectedProduct === p
                                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                                                            : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                                                        }`}
                                                >
                                                    {p}
                                                    {selectedProduct === p && <ArrowRight size={16} className="text-white/80" />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <Button
                                onClick={handleGenerate}
                                loading={generating}
                                className="w-full sm:w-auto h-[60px] px-8 rounded-2xl text-[15px] font-bold shadow-xl shadow-blue-600/25 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-1 transition-all duration-300 relative z-0 mt-auto"
                            >
                                <Sparkles size={20} className={`mr-2.5 ${generating ? "" : "text-blue-200 animate-pulse"}`} />
                                Jalankan Prediksi
                            </Button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600 relative z-10">
                        {error}
                    </div>
                )}
            </div>

            {/* Hasil Analisis AI - Super Premium Dark Card matching the provided image */}
            {result && (
                <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#1e3a8a] p-8 sm:p-10 text-white shadow-2xl shadow-blue-900/30 relative animate-in fade-in slide-in-from-bottom-4 duration-700 z-0">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px]" />

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-300 mb-6 backdrop-blur-md shadow-sm">
                            <Sparkles size={14} className="text-blue-400" /> Hasil Analisis AI
                        </div>

                        <div className="text-base font-medium text-slate-300 mb-1">
                            Proyeksi kebutuhan <strong className="text-white font-bold">{result.forecast.productName}</strong>
                        </div>

                        {/* Big Glowing Number */}
                        <div className="font-display text-[64px] sm:text-[80px] leading-none font-black tracking-tighter text-[#93c5fd] drop-shadow-[0_0_20px_rgba(147,197,253,0.3)]">
                            {result.forecast.predictedQuantity} <span className="text-2xl sm:text-3xl font-medium text-slate-400 ml-2 tracking-normal">{currentUnit}</span>
                        </div>

                        <div className="mt-4 text-sm font-medium text-slate-400 mb-10 flex items-center gap-2">
                            <Calendar size={16} /> Periode Target: <span className="text-slate-200">{formatPeriode(result.forecast.period)}</span>
                        </div>

                        {/* Chart Container */}
                        <div className="rounded-[24px] bg-white p-5 sm:p-7 text-slate-900 shadow-2xl h-[340px] w-full border border-blue-50">
                            <ForecastChart data={result.detail.monthlyTotals} />
                        </div>

                        {result.detail.monthlyTotals.length > 0 && (
                            <div className="mt-8 border-t border-white/10 pt-6">
                                <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                    <Activity size={14} /> Histori Bulanan yang Dianalisis
                                </div>
                                <div className="flex flex-wrap gap-2.5">
                                    {result.detail.monthlyTotals.map((m) => (
                                        <span
                                            key={m.periodKey}
                                            className="rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold backdrop-blur-sm border border-white/10 transition hover:bg-white/10 flex items-center gap-2"
                                        >
                                            <span className="text-slate-300">{m.periodKey}</span>
                                            <span className="h-3 w-px bg-white/20"></span>
                                            <span className="text-blue-300">{m.quantity} {currentUnit}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {result && (result.bufferPersen ?? 0) > 0 && (
                <div className="flex items-start gap-3 rounded-[24px] border border-amber-200 bg-amber-50 p-5 sm:p-6 text-sm font-medium text-amber-800 shadow-sm">
                    <CloudRain size={20} className="mt-0.5 shrink-0" />
                    <div className="leading-relaxed">
                        <span className="font-bold">
                            Cuaca {result.cuaca?.kota ?? "wilayahmu"} berisiko dalam beberapa hari
                            ke depan.
                        </span>{" "}
                        {result.cuaca?.peringatan?.pesan}{" "}
                        Disarankan tambah buffer {result.bufferPersen}% jadi sekitar{" "}
                        <span className="font-bold">{result.jumlahDenganBuffer}</span> — angka
                        prediksi AI di atas tidak berubah, ini cuma saran jaga-jaga kalau pasokan
                        dari pemasok berpotensi telat.
                    </div>
                </div>
            )}

            {/* Transparansi Cara Perhitungan */}
            {result && (
                <div className="rounded-[32px] border border-blue-100 bg-white p-6 sm:p-10 shadow-[0_8px_30px_rgb(59,130,246,0.06)] animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-blue-50 text-blue-600 border border-blue-100">
                            <Info size={26} />
                        </span>
                        <div>
                            <h3 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">
                                Transparansi Perhitungan
                            </h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">
                                {result.detail.aiApplied
                                    ? "Model hybrid: jaringan saraf tiruan yang dilatih dari histori penjualanmu sendiri, digabung dengan model statistik agar hasilnya logis dan bisa ditelusuri."
                                    : "Menggunakan metode statistik deret waktu agar hasilnya logis dan bisa ditelusuri."}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                        <Komponen
                            label="Rata-rata Bergerak"
                            nilai={result.detail.movingAverage}
                            catatan="3 bulan terakhir"
                        />
                        <Komponen
                            label="Proyeksi Tren Linear"
                            nilai={result.detail.linearTrend}
                            catatan="Regresi kuadrat terkecil"
                        />
                        <Komponen
                            label="Faktor Musiman"
                            nilai={result.detail.seasonalFactor}
                            catatan={
                                result.detail.seasonalityApplied
                                    ? "Pola musiman aktif"
                                    : "Tidak ada musim spesifik"
                            }
                        />
                        <Komponen
                            label="Faktor Hari Libur"
                            nilai={result.detail.holidayFactor}
                            catatan={
                                result.detail.holidayApplied
                                    ? result.detail.holidayList?.join(", ") || "Ada libur nasional"
                                    : "Tidak ada libur terdeteksi"
                            }
                        />
                        <Komponen
                            label="Model AI (Neural Network)"
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

                    <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 rounded-[24px] bg-slate-50 p-6 border border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Kombinasi Algoritma:</span>
                            <code className="rounded-xl bg-white px-4 py-2 font-bold text-blue-600 border border-slate-200 shadow-sm text-sm">
                                {formatAlgorithmName(result.algoritma)}
                            </code>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Data Historis:</span>
                            <span className="font-extrabold text-slate-800 text-sm bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                                {result.detail.monthsOfData ?? 0} bulan
                                {result.detail.lastDataPeriod &&
                                    ` (Terakhir ${result.detail.lastDataPeriod})`}
                            </span>
                        </div>
                    </div>

                    {result.detail.holidayNote && (
                        <div className="mt-6 flex items-start gap-3 rounded-[20px] bg-blue-50/80 border border-blue-100 p-5">
                            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-blue-900 leading-relaxed">
                                <strong className="text-blue-700">Catatan AI: </strong>
                                {result.detail.holidayNote}
                            </p>
                        </div>
                    )}

                    {result.detail.keterangan && (
                        <div
                            className={`mt-5 rounded-[20px] p-6 text-[15px] font-bold leading-relaxed border ${result.detail.seasonalityApplied
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                                    : "bg-blue-50 border-blue-100 text-blue-900"
                                }`}
                        >
                            {result.detail.keterangan}
                        </div>
                    )}
                </div>
            )}

            {/* Riwayat prediksi */}
            <div className="rounded-[32px] border border-blue-100 bg-white p-6 sm:p-10 shadow-[0_8px_30px_rgb(59,130,246,0.06)] relative z-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-50 text-slate-600 border border-slate-200/60">
                            <History size={24} />
                        </span>
                        <div>
                            <h3 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">Riwayat Prediksi</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">Total {history.length} prediksi tersimpan</p>
                        </div>
                    </div>
                </div>

                {loadingHistory ? (
                    <div className="py-12 text-center text-sm font-bold text-slate-400 animate-pulse">Memuat riwayat...</div>
                ) : history.length === 0 ? (
                    <div className="rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center text-[15px] font-bold text-slate-500">
                        Belum ada riwayat prediksi yang pernah dibuat.
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-[20px] border border-slate-100">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
                                        <th className="py-5 px-6">Bahan Baku</th>
                                        <th className="py-5 px-6">Hasil Prediksi</th>
                                        <th className="py-5 px-6">Periode Target</th>
                                        <th className="py-5 px-6">Tanggal Dibuat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paginatedHistory.map((f) => {
                                        const histUnit = getExactUnit(f.productName, records);
                                        return (
                                            <tr key={f.id} className="transition-colors hover:bg-blue-50/40">
                                                <td className="py-5 px-6 font-bold text-slate-900">
                                                    {f.productName}
                                                </td>
                                                <td className="py-5 px-6">
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 font-extrabold text-blue-700 border border-blue-100/50">
                                                        <TrendingUp size={14} /> {f.predictedQuantity} <span className="text-xs font-semibold text-blue-400/80">{histUnit}</span>
                                                    </span>
                                                </td>
                                                <td className="py-5 px-6 font-medium text-slate-600">
                                                    {formatPeriode(f.period)}
                                                </td>
                                                <td className="py-5 px-6 font-medium text-slate-400">
                                                    {new Date(f.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                                <div className="text-sm font-medium text-slate-500">
                                    Halaman <strong className="text-slate-800">{currentPage}</strong> dari <strong className="text-slate-800">{totalPages}</strong>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={16} /> Prev
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Next <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
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
        <div className="group rounded-[24px] border border-blue-50 bg-white p-6 shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br from-blue-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 relative z-10">{label}</div>
            <div className="font-display text-3xl font-black text-slate-800 tracking-tight relative z-10">
                {nilai == null ? "-" : nilai}
            </div>
            <div className="mt-3 text-xs font-bold text-blue-600/70 relative z-10">{catatan}</div>
        </div>
    );
}