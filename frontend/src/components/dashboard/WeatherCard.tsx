"use client";

import { useCallback, useEffect, useState } from "react";
import { CloudRain, Sun, CloudSun, AlertTriangle, Droplets } from "lucide-react";
import { fetchPrakiraanCuaca } from "@/lib/weather";
import type { PrakiraanCuaca, PrakiraanHarian, TingkatRisiko } from "@/types/weather";

const GAYA_RISIKO: Record<TingkatRisiko, string> = {
    aman: "bg-green-50 text-green-700",
    rendah: "bg-blue-50 text-brand-blue",
    sedang: "bg-amber-50 text-amber-700",
    tinggi: "bg-red-50 text-red-700",
};

function IkonCuaca({ deskripsi, size = 17 }: { deskripsi: string; size?: number }) {
    const d = deskripsi.toLowerCase();

    if (d.includes("hujan") || d.includes("petir")) {
        return <CloudRain size={size} className="text-brand-blue" />;
    }
    if (d.includes("berawan") || d.includes("mendung")) {
        return <CloudSun size={size} className="text-brand-blue" />;
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

    if (sama) return "Hari ini";
    return d.toLocaleDateString("id-ID", { weekday: "long" });
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    if (loading) {
        return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />;
    }

    if (!data?.tersedia) return null;

    const peringatan = data.peringatan;
    const harian = data.harian ?? [];

    return (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h3 className="font-display text-lg font-bold text-ink">Cuaca & Risiko Pasokan</h3>
                    <p className="mt-0.5 text-xs text-ink-soft">
                        {data.kota}
                        {data.kecamatan ? `, ${data.kecamatan}` : ""} · sumber {data.sumber}
                    </p>
                </div>
            </div>

            {peringatan && (
                <div
                    className={`mt-4 flex items-start gap-2.5 rounded-xl p-3.5 text-sm ${GAYA_RISIKO[peringatan.tingkat]
                        }`}
                >
                    {peringatan.ada ? (
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    ) : (
                        <Sun size={16} className="mt-0.5 shrink-0" />
                    )}
                    <span>{peringatan.pesan}</span>
                </div>
            )}

            {harian.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {harian.map((h) => (
                        <HariCuaca key={h.tanggal} h={h} />
                    ))}
                </div>
            )}

            <p className="mt-4 text-xs text-ink-soft">
                {peran === "supplier"
                    ? "Prakiraan ini membantu memperkirakan gangguan panen dan jadwal pengiriman."
                    : "Prakiraan ini tidak mengubah angka prediksi AI, tapi kalau berisiko akan muncul sebagai saran buffer stok di halaman Prediksi AI dan Rekomendasi Pembelian."}
            </p>

            <p className="mt-2 text-[11px] text-ink-soft/70">
                Data cuaca bersumber dari{" "}
                <a
                    href="https://bmkg.go.id/publik/prakiraan-cuaca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-ink-soft"
                >
                    BMKG
                </a>             .
            </p>
        </div>
    );
}

function HariCuaca({ h }: { h: PrakiraanHarian }) {
    return (
        <div className="rounded-xl bg-paper-soft p-3.5">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink">{namaHari(h.tanggal)}</span>
                <IkonCuaca deskripsi={h.deskripsi} />
            </div>

            <div className="mt-2 text-sm font-semibold text-ink">{h.deskripsi}</div>

            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
                {h.suhu != null && <span>{h.suhu}°C</span>}
                {h.kelembapan != null && (
                    <span className="inline-flex items-center gap-1">
                        <Droplets size={11} /> {h.kelembapan}%
                    </span>
                )}
            </div>

            {(h.risiko === "tinggi" || h.risiko === "sedang") && (
                <div
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${GAYA_RISIKO[h.risiko]
                        }`}
                >
                    risiko {h.risiko}
                </div>
            )}
        </div>
    );
}