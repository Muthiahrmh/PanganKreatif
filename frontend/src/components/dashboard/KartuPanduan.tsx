"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, X, Rocket } from "lucide-react";
import { ambilPanduan, panduanDitutup, tutupPanduan } from "@/lib/onboarding";
import type { Panduan } from "@/types/onboarding";

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
            setData(null);
            setGalat(err instanceof Error ? err.message : "Panduan gagal dimuat");
        } finally {
            setMemuat(false);
        }
    }, []);

    useEffect(() => {
        muat();
        setDitutup(panduanDitutup());
    }, [muat]);

    if (memuat) return <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />;

    if (galat) {
        return (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
                <span className="font-bold">Panduan gagal dimuat:</span> {galat}
            </div>
        );
    }

    if (!data || !data.berlaku || data.tuntas) return null;

    // JIKA DITUTUP: Muncul sebagai Tombol Melayang (Floating) di pojok kanan bawah
    if (ditutup) {
        return (
            <button
                onClick={() => {
                    window.localStorage.removeItem("pangankreatif-panduan-ditutup");
                    setDitutup(false);
                }}
                className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:scale-110 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
                style={{ backgroundColor: aksen }}
                title="Tampilkan Panduan Awal"
            >
                <Rocket size={24} />
                {/* Lencana penanda ada tugas belum selesai */}
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white">
                    !
                </span>
            </button>
        );
    }

    const persen = Math.round((data.selesai / data.total) * 100);
    const berikutnya = data.langkah.find((l) => !l.selesai);

    // JIKA TERBUKA: Tampil sebagai kartu panduan di atas Dashboard
    return (
        <div className="relative rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-transform hover:scale-105"
                        style={{ backgroundColor: aksen }}
                    >
                        <Rocket size={22} />
                    </span>

                    <div>
                        <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                            Langkah Awal di PanganKreatif
                        </h3>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                            {data.selesai} dari {data.total} langkah selesai
                            {berikutnya ? ` · Lanjut ke ${berikutnya.judul.toLowerCase()}` : ""}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        tutupPanduan();
                        setDitutup(true);
                    }}
                    aria-label="Sembunyikan panduan"
                    className="rounded-full bg-slate-50 p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="mt-6 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.max(persen, 3)}%`, backgroundColor: aksen }}
                />
            </div>

            <div className="mt-6 space-y-3">
                {data.langkah.map((l, i) => (
                    <div
                        key={l.kode}
                        className={`group flex flex-col justify-between gap-4 rounded-2xl p-4 transition-all sm:flex-row sm:items-center ${l.selesai
                                ? "border border-emerald-100 bg-emerald-50/60"
                                : "border border-slate-200 bg-slate-50 hover:border-slate-300 hover:shadow-sm"
                            }`}
                    >
                        <div className="flex min-w-0 items-start gap-4 sm:items-center">
                            <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold transition-colors ${l.selesai
                                        ? "bg-emerald-500 text-white shadow-sm"
                                        : "bg-slate-200 text-slate-500"
                                    }`}
                            >
                                {l.selesai ? <Check size={16} strokeWidth={3} /> : i + 1}
                            </span>

                            <div className="min-w-0 flex-1">
                                <div
                                    className={`text-[15px] font-bold ${l.selesai ? "text-emerald-800" : "text-slate-800"
                                        }`}
                                >
                                    {l.judul}
                                    {l.selesai && l.jumlah > 0 && (
                                        <span className="ml-2 inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                            {l.jumlah} TERCATAT
                                        </span>
                                    )}
                                </div>

                                {!l.selesai && (
                                    <p className="mt-1 text-[13px] font-medium leading-relaxed text-slate-500">
                                        {l.pesan}
                                    </p>
                                )}
                            </div>
                        </div>

                        {!l.selesai && (
                            <Link
                                href={l.tautan}
                                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:w-auto"
                                style={{ backgroundColor: aksen }}
                            >
                                {l.aksi} <ArrowRight size={14} />
                            </Link>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}   