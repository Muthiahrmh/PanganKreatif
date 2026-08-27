"use client";

import { useCallback, useEffect, useState } from "react";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Wallet } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatRupiah, formatRupiahShort } from "@/lib/format";

type Mode = "bulanan" | "tahun" | "tahunan";

interface BarisPendapatan {
    kunci: string;
    label: string;
    pendapatan: number;
    nilaiTransaksi: number;
    potongan: number;
    volume: number;
    transaksi: number;
}

interface Pembanding {
    jenis: "bulan" | "tahun";
    label: string;
    nilaiPembanding: number;
    persen: number | null;
}

interface DataPendapatan {
    rentang: Mode;
    tahunDipilih: number | null;
    tahunTersedia: number[];
    seri: BarisPendapatan[];
    ringkasan: {
        total: number;
        totalPotongan: number;
        rataRata: number;
        periodeTerakhir: number;
        pembanding: Pembanding | null;
        belumDiteruskan: number;
        jumlahTransaksi: number;
    };
}

export function GrafikPendapatan() {
    const [mode, setMode] = useState<Mode>("bulanan");
    const [tahun, setTahun] = useState<number | null>(null);
    const [data, setData] = useState<DataPendapatan | null>(null);
    const [memuat, setMemuat] = useState(true);
    const [galat, setGalat] = useState<string | null>(null);

    const muat = useCallback(async () => {
        try {
            const res = await api.get<DataPendapatan>("/supplier/pendapatan", {
                params: {
                    rentang: mode,
                    ...(mode === "tahun" && tahun ? { tahun } : {}),
                },
            });
            setData(res.data);
            if (mode === "tahun" && !tahun && res.data.tahunDipilih) {
                setTahun(res.data.tahunDipilih);
            }
            setGalat(null);
        } catch (err) {
            setGalat(getApiErrorMessage(err));
        } finally {
            setMemuat(false);
        }
    }, [mode, tahun]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        muat();
    }, [muat]);

    if (galat) {
        return (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700 shadow-sm">
                Grafik pendapatan gagal dimuat: {galat}
            </div>
        );
    }

    const r = data?.ringkasan;
    const p = r?.pembanding;
    const naik = (p?.persen ?? 0) > 0;
    const turun = (p?.persen ?? 0) < 0;

    const adaIsi = (data?.seri ?? []).some((b) => b.pendapatan > 0);

    const judulPeriode =
        mode === "tahun"
            ? `Total ${data?.tahunDipilih ?? ""}`
            : mode === "tahunan"
                ? "Tahun Ini"
                : "Bulan Ini";

    const judulTotal =
        mode === "tahun"
            ? "Rata-rata Per Bulan"
            : mode === "tahunan"
                ? "Total 5 Tahun"
                : "Total 12 Bulan";

    const nilaiTotal = mode === "tahun" ? (r?.rataRata ?? 0) : (r?.total ?? 0);

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div>
                    <h3 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-slate-900 tracking-tight">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shadow-sm">
                            <Wallet size={18} />
                        </span>
                        Tren Pendapatan
                    </h3>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                        Dana bersih yang menjadi hakmu setelah dipotong margin platform.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 shadow-inner">
                        {(
                            [
                                ["bulanan", "12 Bulan"],
                                ["tahun", "Per Tahun"],
                                ["tahunan", "5 Tahun"],
                            ] as const
                        ).map(([nilai, label]) => (
                            <button
                                key={nilai}
                                onClick={() => {
                                    setMode(nilai);
                                    setMemuat(true);
                                }}
                                className={`rounded-lg px-4 py-2 text-[13px] font-bold transition-all ${mode === nilai
                                        ? "bg-white text-emerald-700 shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {mode === "tahun" && (data?.tahunTersedia.length ?? 0) > 0 && (
                        <select
                            value={tahun ?? data?.tahunDipilih ?? ""}
                            onChange={(e) => {
                                setTahun(Number(e.target.value));
                                setMemuat(true);
                            }}
                            aria-label="Pilih tahun"
                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-[13px] font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                            {data?.tahunTersedia.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {memuat ? (
                <div className="mt-8 h-80 animate-pulse rounded-3xl bg-slate-100" />
            ) : (
                <>
                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/80 to-white p-5 shadow-sm">
                            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                                {judulPeriode}
                            </div>
                            <div className="mt-1 font-display text-2xl lg:text-3xl font-extrabold text-emerald-700">
                                {formatRupiah(r?.periodeTerakhir ?? 0)}
                            </div>

                            {p?.persen !== null && p?.persen !== undefined ? (
                                <div
                                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${naik
                                            ? "bg-emerald-100 text-emerald-700"
                                            : turun
                                                ? "bg-red-100 text-red-600"
                                                : "bg-slate-100 text-slate-600"
                                        }`}
                                >
                                    {naik ? (
                                        <TrendingUp size={12} strokeWidth={3} />
                                    ) : turun ? (
                                        <TrendingDown size={12} strokeWidth={3} />
                                    ) : (
                                        <Minus size={12} strokeWidth={3} />
                                    )}
                                    {Math.abs(p.persen)}% {p.label}
                                </div>
                            ) : (
                                <div className="mt-2 text-xs font-medium text-slate-400">
                                    Belum ada pembanding
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                {judulTotal}
                            </div>
                            <div className="mt-1 font-display text-2xl lg:text-3xl font-extrabold text-slate-900">
                                {formatRupiah(nilaiTotal)}
                            </div>
                            <div className="mt-2 text-xs font-semibold text-slate-500">
                                Total {r?.jumlahTransaksi ?? 0} transaksi
                            </div>
                        </div>

                        <div className="rounded-2xl border border-amber-100 bg-gradient-to-b from-amber-50/80 to-white p-5 shadow-sm">
                            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                                Belum Diteruskan
                            </div>
                            <div className="mt-1 font-display text-2xl lg:text-3xl font-extrabold text-amber-600">
                                {formatRupiah(r?.belumDiteruskan ?? 0)}
                            </div>
                            <div className="mt-2 text-xs font-semibold text-amber-700/80">
                                Menunggu kliring platform
                            </div>
                        </div>
                    </div>

                    {p?.jenis === "tahun" && mode === "tahun" && (p.nilaiPembanding ?? 0) > 0 && (
                        <p className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-[13px] font-medium text-slate-600 leading-relaxed">
                            Tahun {(data?.tahunDipilih ?? 0) - 1} pendapatanmu mencapai{" "}
                            <strong className="text-slate-800">{formatRupiah(p.nilaiPembanding)}</strong>.
                            Sedangkan tahun {data?.tahunDipilih} baru mencapai{" "}
                            <strong className="text-slate-800">{formatRupiah(r?.total ?? 0)}</strong>.
                        </p>
                    )}

                    {adaIsi ? (
                        <div className="mt-8 h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={data?.seri ?? []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={12}
                                        stroke="#64748b"
                                    />
                                    <YAxis
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        stroke="#64748b"
                                        tickFormatter={(v) => formatRupiahShort(v)}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                            padding: '12px 16px',
                                            fontWeight: 'bold'
                                        }}
                                        formatter={(value, name) => [
                                            formatRupiah(Number(value)),
                                            String(name),
                                        ]}
                                    />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '24px', fontSize: '13px', fontWeight: 600, color: '#475569' }}
                                        iconType="circle"
                                    />
                                    <Bar
                                        dataKey="pendapatan"
                                        name="Diterima Bersih"
                                        fill="#10b981"
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={48}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="nilaiTransaksi"
                                        name="Total Transaksi"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 0 }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                            <p className="text-[13px] font-medium text-slate-500">
                                {mode === "tahun"
                                    ? `Belum ada pendapatan tercatat pada tahun ${data?.tahunDipilih}.`
                                    : "Belum ada pendapatan tercatat. Grafik terisi setelah ada pembayaran UMKM yang dikonfirmasi."}
                            </p>
                        </div>
                    )}

                    {adaIsi && (
                        <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                            <p className="text-[11px] font-semibold text-slate-400">
                                Selisih antara garis biru dan batang hijau adalah potongan platform.
                            </p>
                            <p className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                                Total Potongan: {formatRupiah(r?.totalPotongan ?? 0)}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}