"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, X, Rocket } from "lucide-react";
import { ambilPanduan, panduanDitutup, tutupPanduan } from "@/lib/onboarding";
import type { Panduan } from "@/types/onboarding";

/**
 * Panduan langkah pertama.
 *
 * Muncul sampai pengguna menyelesaikan seluruh langkah, lalu hilang
 * dengan sendirinya. Bisa ditutup lebih awal kalau dirasa mengganggu.
 */
export function KartuPanduan({ aksen }: { aksen: string }) {
    const [data, setData] = useState<Panduan | null>(null);
    const [memuat, setMemuat] = useState(true);
    const [ditutup, setDitutup] = useState(false);
    const [galat, setGalat] = useState<string | null>(null);

    const muat = useCallback(async () => {
        try {
            setData(await ambilPanduan());
            setGalat(null);
        } catch (err) {
            // Ditampilkan, bukan didiamkan — kartu yang hilang tanpa
            // penjelasan jauh lebih sulit ditelusuri
            setData(null);
            setGalat(err instanceof Error ? err.message : "Panduan gagal dimuat");
        } finally {
            setMemuat(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        muat();
        setDitutup(panduanDitutup());
    }, [muat]);

    if (memuat) return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />;

    if (galat) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Panduan gagal dimuat: {galat}
            </div>
        );
    }

    if (!data) {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Panduan tidak mengembalikan data.
            </div>
        );
    }

    if (!data.berlaku) {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Panduan belum berlaku untuk akun ini — profil UMKM atau pemasok belum lengkap.
            </div>
        );
    }

    if (data.tuntas) return null;

    if (ditutup) {
        return (
            <button
                onClick={() => {
                    window.localStorage.removeItem("pangankreatif-panduan-ditutup");
                    setDitutup(false);
                }}
                className="w-full rounded-2xl border border-dashed border-ink/15 bg-white px-4 py-3 text-sm text-ink-soft transition hover:border-brand-blue hover:text-ink"
            >
                Tampilkan lagi panduan langkah awal ({data.selesai}/{data.total} selesai)
            </button>
        );
    }

    const persen = Math.round((data.selesai / data.total) * 100);
    // Langkah berikutnya yang belum selesai
    const berikutnya = data.langkah.find((l) => !l.selesai);

    return (
        <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: aksen }}
                    >
                        <Rocket size={17} />
                    </span>

                    <div>
                        <h3 className="font-display text-lg font-bold text-ink">
                            Langkah Awal di PanganKreatif
                        </h3>
                        <p className="mt-0.5 text-sm text-ink-soft">
                            {data.selesai} dari {data.total} langkah selesai
                            {berikutnya ? ` · lanjut ke ${berikutnya.judul.toLowerCase()}` : ""}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        tutupPanduan();
                        setDitutup(true);
                    }}
                    aria-label="Sembunyikan panduan"
                    className="rounded-lg p-1.5 text-ink-soft transition hover:bg-paper-soft"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${Math.max(persen, 3)}%`, backgroundColor: aksen }}
                />
            </div>

            <div className="mt-4 space-y-2">
                {data.langkah.map((l, i) => (
                    <div
                        key={l.kode}
                        className={`flex items-start gap-3 rounded-xl p-3 ${l.selesai ? "bg-green-50/60" : "border border-ink/5"
                            }`}
                    >
                        <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${l.selesai
                                    ? "bg-brand-green text-white"
                                    : "bg-paper-soft text-ink-soft"
                                }`}
                        >
                            {l.selesai ? <Check size={13} /> : i + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                            <div
                                className={`text-sm font-medium ${l.selesai ? "text-green-700" : "text-ink"
                                    }`}
                            >
                                {l.judul}
                                {l.selesai && l.jumlah > 0 && (
                                    <span className="ml-2 text-xs font-normal text-green-600">
                                        {l.jumlah} tercatat
                                    </span>
                                )}
                            </div>

                            {!l.selesai && (
                                <p className="mt-0.5 text-xs text-ink-soft">{l.pesan}</p>
                            )}
                        </div>

                        {!l.selesai && (
                            <Link
                                href={l.tautan}
                                className="inline-flex shrink-0 items-center gap-1 self-center rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                                style={{ backgroundColor: aksen }}
                            >
                                {l.aksi} <ArrowRight size={12} />
                            </Link>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}