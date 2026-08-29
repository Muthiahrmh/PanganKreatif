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
    CloudRain,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatNumber, formatRupiah, relativeDeadline } from "@/lib/format";
import type { PrakiraanCuaca } from "@/types/weather";

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
    jumlahDenganBuffer: number | null;
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
    if (arah === "naik") return <TrendingUp size={13} className="text-amber-600" />;
    if (arah === "turun") return <TrendingDown size={13} className="text-brand-green" />;
    return <Minus size={13} className="text-ink-soft" />;
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
 * terbuka, dan pemasok termurah menjadi satu saran tindakan —
 * bukan sekadar menampilkan angka prediksi.
 */
export function KartuRekomendasi() {
    const [data, setData] = useState<Rekomendasi[]>([]);
    const [siap, setSiap] = useState(true);
    const [loading, setLoading] = useState(true);
    const [galat, setGalat] = useState<string | null>(null);
    const [cuaca, setCuaca] = useState<PrakiraanCuaca | undefined>(undefined);
    const [bufferPersen, setBufferPersen] = useState(0);

    const muat = useCallback(async () => {
        try {
            const res = await api.get<{
                siap: boolean;
                rekomendasi: Rekomendasi[];
                cuaca?: PrakiraanCuaca;
                bufferPersen?: number;
            }>("/forecasts/rekomendasi");
            setSiap(res.data.siap);
            setData(res.data.rekomendasi ?? []);
            setCuaca(res.data.cuaca);
            setBufferPersen(res.data.bufferPersen ?? 0);
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
        return <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />;
    }

    if (galat) return null;

    if (!siap || data.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-ink/15 bg-white p-6 text-center">
                <Sparkles size={24} className="mx-auto text-ink-soft" />
                <h3 className="mt-2 font-display text-base font-bold text-ink">
                    Rekomendasi belum bisa dibuat
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
                    Catat dulu penjualan harian kamu. Setelah ada riwayat, sistem akan menyarankan
                    berapa yang perlu dibeli dan dari siapa.
                </p>
                <Link
                    href="/dashboard/sales"
                    className="mt-3 inline-block rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                    Catat penjualan
                </Link>
            </div>
        );
    }

    const totalHemat = data.reduce((s, r) => s + Math.max(r.potensiHemat, 0), 0);

    return (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                        <Sparkles size={17} className="text-brand-blue" />
                        Rekomendasi Pembelian
                    </h3>
                    <p className="mt-1 text-sm text-ink-soft">
                        Berapa yang perlu dibeli, dari siapa, dan kapan sebaiknya memesan.
                    </p>
                </div>

                {totalHemat > 0 && (
                    <div className="rounded-lg bg-green-50 px-3 py-2 text-right">
                        <div className="text-xs text-green-700">Potensi hemat</div>
                        <div className="font-display text-base font-bold text-green-700">
                            {formatRupiah(totalHemat)}
                        </div>
                    </div>
                )}
            </div>

            {bufferPersen > 0 && cuaca?.peringatan?.ada && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-800">
                    <CloudRain size={16} className="mt-0.5 shrink-0" />
                    <span>
                        {cuaca.peringatan.pesan} Jumlah "dengan buffer" di bawah menambahkan{" "}
                        {bufferPersen}% cadangan untuk jaga-jaga.
                    </span>
                </div>
            )}

            <div className="mt-5 space-y-3">
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
        <div className="rounded-xl border border-ink/5 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-ink">{r.bahan}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
                            <IkonArah arah={r.arah} />
                            {r.arah === "stabil" ? "stabil" : `${r.arah} ${r.persen}%`}
                        </span>
                        {r.musimanAktif && (
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-blue">
                                pola musiman
                            </span>
                        )}
                    </div>

                    <div className="mt-1 text-xs text-ink-soft">
                        Perkiraan kebutuhan {namaBulan(r.periode)} ·{" "}
                        rata-rata 3 bulan {formatNumber(r.rataRata)} {r.satuan}
                    </div>
                </div>

                <div className="text-right">
                    <div className="font-display text-lg font-bold text-brand-blue">
                        {formatNumber(r.prediksi)} {r.satuan}
                    </div>
                    {r.jumlahDenganBuffer != null && (
                        <div className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                            <CloudRain size={11} />
                            dengan buffer: {formatNumber(r.jumlahDenganBuffer)} {r.satuan}
                        </div>
                    )}
                    <div className="text-xs text-ink-soft">
                        termurah {formatRupiah(r.pemasokTermurah.harga)}/{r.satuan}
                    </div>
                </div>
            </div>

            {/* Saran tindakan */}
            {p && !p.sudahGabung && (
                <div className="mt-3 rounded-lg bg-blue-50 p-3">
                    <div className="text-sm text-brand-blue">
                        <span className="font-semibold">{p.supplier}</span> sedang membuka pesanan
                        kolektif.{" "}
                        {p.grosirAktif ? (
                            <>
                                Harga grosir sudah aktif di {formatRupiah(p.hargaBerlaku)}/
                                {p.satuan}.
                            </>
                        ) : p.minGrosir ? (
                            <>
                                Kurang {formatNumber(p.sisaKeGrosir)} {p.satuan} lagi supaya harga
                                turun jadi {formatRupiah(p.hargaGrosir ?? 0)}/{p.satuan}.
                            </>
                        ) : (
                            <>Harga {formatRupiah(p.hargaBerlaku)}/{p.satuan}.</>
                        )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                        <span className="inline-flex items-center gap-1">
                            <Users size={12} /> {p.peserta} UMKM
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Clock size={12} /> {relativeDeadline(p.deadline)}
                        </span>
                        {r.potensiHemat > 0 && (
                            <span className="font-medium text-green-700">
                                hemat {formatRupiah(r.potensiHemat)}
                            </span>
                        )}
                    </div>

                    <Link
                        href="/dashboard/procurement"
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-blue px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
                    >
                        <ShoppingCart size={14} /> Gabung pesanan
                    </Link>
                </div>
            )}

            {p && p.sudahGabung && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                    <Check size={14} className="shrink-0" />
                    Sudah bergabung di pesanan {p.supplier}
                    {p.grosirAktif
                        ? ` — harga grosir aktif`
                        : p.minGrosir
                            ? ` — kurang ${formatNumber(p.sisaKeGrosir)} ${p.satuan} lagi ke harga grosir`
                            : ""}
                </div>
            )}

            {!p && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper-soft px-3 py-2 text-sm">
                    <span className="text-ink-soft">
                        Belum ada pesanan kolektif untuk {r.bahan}. Tersedia dari{" "}
                        {r.pemasokTermurah.jumlahPemasok} pemasok, termurah{" "}
                        {r.pemasokTermurah.groupName}.
                    </span>

                    <Link
                        href="/dashboard/suppliers"
                        className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-brand-blue hover:underline"
                    >
                        <Store size={13} /> Lihat pemasok
                    </Link>
                </div>
            )}
        </div>
    );
}