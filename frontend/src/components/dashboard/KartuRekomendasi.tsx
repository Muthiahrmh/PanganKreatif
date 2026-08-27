"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    Sparkles,
    TrendingUp,
    TrendingDown,
    Minus,
    ShoppingCart,
    Store,
    Check,
    Users,
    Clock,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatNumber, formatRupiah, relativeDeadline } from "@/lib/format";

type Arah = "naik" | "turun" | "stabil";
type Tindakan = "gabung" | "cari_pemasok" | "sudah_gabung" | "pantau";

interface PesananTerkait {
    orderId: string;
    supplier: string;
    kota: string;
    satuan: string;
    deadline: string;
    terkumpul: number;
    peserta: number;
    sudahGabung: boolean;
    hargaNormal: number;
    hargaGrosir: number | null;
    hargaBerlaku: number;
    minGrosir: number | null;
    sisaKeGrosir: number;
    grosirAktif: boolean;
    hematPerUnit: number;
}

interface Rekomendasi {
    bahan: string;
    satuan: string;
    prediksi: number;
    periode: string;
    rataRata: number;
    arah: Arah;
    persen: number;
    musimanAktif: boolean;
    pemasokTermurah: {
        groupName: string;
        kota: string;
        harga: number;
        jumlahPemasok: number;
    };
    pesanan: PesananTerkait | null;
    potensiHemat: number;
    tindakan: Tindakan;
}

function IkonArah({ arah }: { arah: Arah }) {
    if (arah === "naik") return <TrendingUp size={14} className="text-red-500" />;
    if (arah === "turun") return <TrendingDown size={14} className="text-emerald-500" />;
    return <Minus size={14} className="text-slate-400" />;
}

function namaBulan(periode: string) {
    const [y, m] = periode.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}

/**
 * Smart Purchasing Recommendation.
 *
 * Menggabungkan prediksi kebutuhan, pesanan kolektif yang sedang
 * terbuka, dan pemasok termurah menjadi satu saran tindakan.
 */
export function KartuRekomendasi() {
    const [data, setData] = useState<Rekomendasi[]>([]);
    const [siap, setSiap] = useState(true);
    const [loading, setLoading] = useState(true);
    const [galat, setGalat] = useState<string | null>(null);

    const muat = useCallback(async () => {
        try {
            const res = await api.get<{ siap: boolean; rekomendasi: Rekomendasi[] }>(
                "/forecasts/rekomendasi"
            );
            setSiap(res.data.siap);
            setData(res.data.rekomendasi ?? []);
            setGalat(null);
        } catch (err) {
            setGalat(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        muat();
    }, [muat]);

    if (loading) {
        return <div className="h-64 animate-pulse rounded-3xl bg-slate-100" />;
    }

    if (galat) return null;

    if (!siap || data.length === 0) {
        return (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
                    <Sparkles size={28} />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-800">
                    Rekomendasi belum bisa dibuat
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 leading-relaxed">
                    Catat dulu penjualan harian kamu. Setelah ada riwayat yang cukup, sistem AI akan menyarankan
                    berapa yang perlu dibeli dan mencari pesanan kolektif termurahnya.
                </p>
                <Link
                    href="/dashboard/sales"
                    className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-[13px] font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5"
                >
                    Mulai Catat Penjualan
                </Link>
            </div>
        );
    }

    const totalHemat = data.reduce((s, r) => s + Math.max(r.potensiHemat, 0), 0);

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h3 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-slate-900 tracking-tight">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                            <Sparkles size={18} />
                        </span>
                        Rekomendasi Pembelian
                    </h3>
                    <p className="mt-1.5 text-sm font-medium text-slate-500 max-w-lg">
                        Saran volume beli, rekomendasi pemasok termurah, dan info pesanan kolektif terdekat.
                    </p>
                </div>

                {totalHemat > 0 && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-right shadow-sm shrink-0">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Potensi Hemat</div>
                        <div className="font-display text-lg font-extrabold text-emerald-700">
                            {formatRupiah(totalHemat)}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {data.map((r) => (
                    <BarisRekomendasi key={r.bahan} r={r} />
                ))}
            </div>
        </div>
    );
}

function BarisRekomendasi({ r }: { r: Rekomendasi }) {
    const p = r.pesanan;

    return (
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3 mb-5">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-extrabold text-slate-800 text-base">{r.bahan}</span>
                        {r.musimanAktif && (
                            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border border-indigo-100">
                                Musiman
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <span>Prediksi {namaBulan(r.periode)}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] ${r.arah === 'naik' ? 'bg-red-50 text-red-600' : r.arah === 'turun' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                            <IkonArah arah={r.arah} /> {r.arah === "stabil" ? "Stabil" : `${r.arah} ${r.persen}%`}
                        </span>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <div className="font-display text-2xl font-extrabold text-blue-600">
                        {formatNumber(r.prediksi)} <span className="text-sm font-semibold text-blue-400">{r.satuan}</span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-400 mt-1">
                        Normal {formatNumber(r.rataRata)} {r.satuan}
                    </div>
                </div>
            </div>

            {/* Saran tindakan */}
            {p && !p.sudahGabung && (
                <div className="mt-auto rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50/80 to-white p-4">
                    <div className="text-[13px] font-medium text-slate-700 leading-relaxed">
                        <strong className="text-blue-800">{p.supplier}</strong> membuka pesanan kolektif.{" "}
                        {p.grosirAktif ? (
                            <span className="text-emerald-600 font-bold">Harga grosir aktif {formatRupiah(p.hargaBerlaku)}/{p.satuan}.</span>
                        ) : p.minGrosir ? (
                            <>
                                Kurang <strong className="text-blue-600">{formatNumber(p.sisaKeGrosir)} {p.satuan}</strong> lagi agar harga turun jadi <strong className="text-blue-600">{formatRupiah(p.hargaGrosir ?? 0)}</strong>.
                            </>
                        ) : (
                            <>Harga {formatRupiah(p.hargaBerlaku)}/{p.satuan}.</>
                        )}
                    </div>

                    <div className="mt-3 mb-4 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                        <span className="inline-flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200">
                            <Users size={13} className="text-slate-400" /> {p.peserta} UMKM
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200">
                            <Clock size={13} className="text-amber-500" /> {relativeDeadline(p.deadline)}
                        </span>
                        {r.potensiHemat > 0 && (
                            <span className="inline-flex items-center text-emerald-600 ml-auto bg-emerald-50 px-2 py-1 rounded-md">
                                Hemat {formatRupiah(r.potensiHemat)}
                            </span>
                        )}
                    </div>

                    <Link
                        href="/dashboard/procurement"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow"
                    >
                        <ShoppingCart size={16} /> Gabung Pesanan Kolektif
                    </Link>
                </div>
            )}

            {p && p.sudahGabung && (
                <div className="mt-auto flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-[13px] font-bold text-emerald-800">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-200 text-emerald-700 shrink-0">
                        <Check size={14} strokeWidth={3} />
                    </span>
                    <div className="leading-tight">
                        Tergabung di pesanan {p.supplier}
                        <div className="text-[11px] text-emerald-600/80 font-semibold mt-0.5">
                            {p.grosirAktif ? "Harga grosir telah aktif" : p.minGrosir ? `Kurang ${formatNumber(p.sisaKeGrosir)} ${p.satuan} ke grosir` : "Menunggu penutupan pesanan"}
                        </div>
                    </div>
                </div>
            )}

            {!p && (
                <div className="mt-auto rounded-xl bg-slate-50 p-4 border border-slate-100 flex flex-col justify-between items-start gap-3">
                    <span className="text-[13px] font-medium text-slate-600 leading-relaxed">
                        Belum ada pesanan kolektif. Tersedia dari <strong className="text-slate-800">{r.pemasokTermurah.jumlahPemasok} pemasok</strong>, termurah <strong className="text-slate-800">{r.pemasokTermurah.groupName}</strong> ({formatRupiah(r.pemasokTermurah.harga)}).
                    </span>

                    <Link
                        href="/dashboard/suppliers"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-[13px] font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                        <Store size={15} /> Buka Katalog Pemasok
                    </Link>
                </div>
            )}
        </div>
    );
}