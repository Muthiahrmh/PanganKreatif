"use client";

import { useCallback, useEffect, useState } from "react";
import { CloudRain, Sun, CloudSun, AlertTriangle, Droplets, Wind } from "lucide-react";
import { fetchPrakiraanCuaca } from "@/lib/weather";
import type { PrakiraanCuaca, PrakiraanHarian, TingkatRisiko } from "@/types/weather";

const GAYA_RISIKO: Record<TingkatRisiko, { badge: string; border: string }> = {
    aman: { badge: "bg-emerald-50 text-emerald-700", border: "border-emerald-100" },
    rendah: { badge: "bg-blue-50 text-blue-700", border: "border-blue-100" },
    sedang: { badge: "bg-amber-50 text-amber-700", border: "border-amber-100" },
    tinggi: { badge: "bg-rose-50 text-rose-700", border: "border-rose-100" },
};

function IkonCuaca({ deskripsi, size = 22 }: { deskripsi: string; size?: number }) {
    const d = deskripsi.toLowerCase();

    if (d.includes("hujan") || d.includes("petir")) {
        return <CloudRain size={size} className="text-blue-500 animate-pulse" />;
    }
    if (d.includes("berawan") || d.includes("mendung")) {
        return <CloudSun size={size} className="text-sky-500" />;
    }
    return <Sun size={size} className="text-amber-500" />;
}

function namaHari(tanggal: string) {
    const d = new Date(`${tanggal}T00:00:00`);
    const hariIni = new Date();
    const sama =
        d.getDate() === hariIni.getDate() &&
        d.getMonth() === hariIni.getMonth() &&
        d.getFullYear() === hariIni.getFullYear();

    if (sama) return "Hari Ini";
    return d.toLocaleDateString("id-ID", { weekday: "short" });
}

export function WeatherCard({ peran = "umkm" }: { peran?: "umkm" | "supplier" }) {
    const [data, setData] = useState<PrakiraanCuaca | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            setData(await fetchPrakiraanCuaca());
        } catch {
            setData({ tersedia: false, kota: null, alasan: "Gagal memuat data cuaca." });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return <div className="h-44 animate-pulse rounded-3xl bg-slate-100" />;
    }

    if (!data?.tersedia) return null;

    const peringatan = data.peringatan;
    const harian = data.harian ?? [];

    return (
        <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-blue-50/20 to-slate-50/50 p-6 sm:p-7 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 mb-2 border border-blue-100/60">
                        🌤️ Pantauan Cuaca & Logistik
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-900 tracking-tight">
                        Kondisi Lingkungan & Risiko Panen
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 font-medium">
                        📍 {data.kota}
                        {data.kecamatan ? `, ${data.kecamatan}` : ""} · Real-time BMKG
                    </p>
                </div>
            </div>

            {peringatan && (
                <div
                    className={`mt-4 flex items-start gap-3 rounded-2xl p-4 text-sm font-medium border ${GAYA_RISIKO[peringatan.tingkat].badge
                        } ${GAYA_RISIKO[peringatan.tingkat].border}`}
                >
                    {peringatan.ada ? (
                        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
                    ) : (
                        <Sun size={20} className="mt-0.5 shrink-0 text-amber-500" />
                    )}
                    <span className="leading-relaxed">{peringatan.pesan}</span>
                </div>
            )}

            {harian.length > 0 && (
                <div className="mt-5 grid gap-3.5 sm:grid-cols-3">
                    {harian.map((h) => (
                        <HariCuaca key={h.tanggal} h={h} />
                    ))}
                </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                <span>
                    {peran === "supplier"
                        ? "Membantu perkiraan gangguan panen & jadwal kirim."
                        : "Kalau berisiko, muncul sebagai saran buffer stok di halaman Prediksi AI dan Rekomendasi Pembelian."}
                </span>
                <a
                    href="https://bmkg.go.id/publik/prakiraan-cuaca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600 hover:underline shrink-0"
                >
                    Sumber BMKG →
                </a>
            </div>
        </div>
    );
}

function HariCuaca({ h }: { h: PrakiraanHarian }) {
    const suhuBulat = h.suhu != null ? Math.round(h.suhu) : null;

    return (
        <div className="group relative rounded-2xl border border-slate-200/70 bg-white p-4 transition-all duration-300 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/5">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{namaHari(h.tanggal)}</span>
                <div className="rounded-xl bg-slate-50 p-2 transition-transform group-hover:scale-110">
                    <IkonCuaca deskripsi={h.deskripsi} />
                </div>
            </div>

            <div className="mt-3 text-sm font-bold text-slate-900 tracking-tight">{h.deskripsi}</div>

            <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 font-semibold">
                {suhuBulat != null && (
                    <span className="inline-flex items-center gap-1">
                        🌡️ {suhuBulat}°C
                    </span>
                )}
                {h.kelembapan != null && (
                    <span className="inline-flex items-center gap-1 text-blue-600">
                        <Droplets size={13} /> {h.kelembapan}%
                    </span>
                )}
            </div>

            {(h.risiko === "tinggi" || h.risiko === "sedang") && (
                <div
                    className={`mt-3 inline-block rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${GAYA_RISIKO[h.risiko].badge
                        }`}
                >
                    ⚠️ Risiko {h.risiko}
                </div>
            )}
        </div>
    );
}   