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

/**
 * Grafik pendapatan pemasok.
 *
 * Batang menunjukkan dana bersih yang menjadi hak pemasok, garis
 * menunjukkan nilai transaksi sebelum potongan. Jaraknya membuat
 * besaran komisi dan margin platform terlihat, bukan disembunyikan.
 */
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
            // Ikuti tahun yang dipilih server kalau belum ditentukan
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
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
                ? "Tahun ini"
                : "Bulan ini";

    const judulTotal =
        mode === "tahun"
            ? "Rata-rata per bulan"
            : mode === "tahunan"
                ? "Total 5 tahun"
                : "Total 12 bulan";

    const nilaiTotal = mode === "tahun" ? (r?.rataRata ?? 0) : (r?.total ?? 0);

    return (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                        <Wallet size={17} className="text-brand-green" />
                        Pendapatan
                    </h3>
                    <p className="mt-0.5 text-sm text-ink-soft">
                        Dana bersih yang menjadi hakmu setelah potongan platform.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-lg bg-paper-soft p-1">
                        {(
                            [
                                ["bulanan", "12 bulan"],
                                ["tahun", "Per tahun"],
                                ["tahunan", "5 tahun"],
                            ] as const
                        ).map(([nilai, label]) => (
                            <button
                                key={nilai}
                                onClick={() => {
                                    setMode(nilai);
                                    setMemuat(true);
                                }}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${mode === nilai
                                        ? "bg-white text-ink shadow-sm"
                                        : "text-ink-soft hover:text-ink"
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
                            className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs outline-none transition focus:border-brand-green"
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
                <div className="mt-5 h-64 animate-pulse rounded-xl bg-slate-100" />
            ) : (
                <>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg bg-paper-soft p-3">
                            <div className="text-xs text-ink-soft">{judulPeriode}</div>
                            <div className="mt-0.5 font-display text-lg font-bold text-brand-green">
                                {formatRupiah(r?.periodeTerakhir ?? 0)}
                            </div>

                            {p?.persen !== null && p?.persen !== undefined ? (
                                <div
                                    className={`mt-0.5 inline-flex items-center gap-1 text-xs ${naik
                                            ? "text-brand-green"
                                            : turun
                                                ? "text-amber-600"
                                                : "text-ink-soft"
                                        }`}
                                >
                                    {naik ? (
                                        <TrendingUp size={12} />
                                    ) : turun ? (
                                        <TrendingDown size={12} />
                                    ) : (
                                        <Minus size={12} />
                                    )}
                                    {Math.abs(p.persen)}% {p.label}
                                </div>
                            ) : (
                                <div className="mt-0.5 text-xs text-ink-soft">
                                    Belum ada pembanding
                                </div>
                            )}
                        </div>

                        <div className="rounded-lg bg-paper-soft p-3">
                            <div className="text-xs text-ink-soft">{judulTotal}</div>
                            <div className="mt-0.5 font-display text-lg font-bold text-ink">
                                {formatRupiah(nilaiTotal)}
                            </div>
                            <div className="mt-0.5 text-xs text-ink-soft">
                                {r?.jumlahTransaksi ?? 0} transaksi
                            </div>
                        </div>

                        <div className="rounded-lg bg-paper-soft p-3">
                            <div className="text-xs text-ink-soft">Belum diteruskan</div>
                            <div className="mt-0.5 font-display text-lg font-bold text-amber-600">
                                {formatRupiah(r?.belumDiteruskan ?? 0)}
                            </div>
                            <div className="mt-0.5 text-xs text-ink-soft">
                                Menunggu dikirim platform
                            </div>
                        </div>
                    </div>

                    {p?.jenis === "tahun" && mode === "tahun" && (p.nilaiPembanding ?? 0) > 0 && (
                        <p className="mt-3 rounded-lg bg-paper-soft px-3 py-2 text-xs text-ink-soft">
                            Tahun {(data?.tahunDipilih ?? 0) - 1} pendapatanmu{" "}
                            {formatRupiah(p.nilaiPembanding)}. Tahun {data?.tahunDipilih}{" "}
                            {formatRupiah(r?.total ?? 0)}.
                        </p>
                    )}

                    {adaIsi ? (
                        <div className="mt-5 h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={data?.seri ?? []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="label" fontSize={12} />
                                    <YAxis
                                        fontSize={12}
                                        tickFormatter={(v) => formatRupiahShort(v)}
                                    />
                                    <Tooltip
                                        formatter={(value, name) => [
                                            formatRupiah(Number(value)),
                                            String(name),
                                        ]}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="pendapatan"
                                        name="Diterima bersih"
                                        fill="#16A34A"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="nilaiTransaksi"
                                        name="Nilai transaksi"
                                        stroke="#2563EB"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="mt-5 rounded-xl border border-dashed border-ink/15 p-8 text-center">
                            <p className="text-sm text-ink-soft">
                                {mode === "tahun"
                                    ? `Belum ada pendapatan tercatat pada tahun ${data?.tahunDipilih}.`
                                    : "Belum ada pendapatan tercatat. Grafik terisi setelah ada pembayaran UMKM yang dikonfirmasi."}
                            </p>
                        </div>
                    )}

                    {adaIsi && (
                        <p className="mt-3 text-xs text-ink-soft">
                            Selisih garis dan batang adalah potongan platform, total{" "}
                            {formatRupiah(r?.totalPotongan ?? 0)} pada periode ini.
                        </p>
                    )}
                </>
            )}
        </div>
    );
}