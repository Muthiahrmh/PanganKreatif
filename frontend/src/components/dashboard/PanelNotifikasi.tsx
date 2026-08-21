"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import {
    ambilNotifikasi,
    tandaiSudahDilihat,
    waktuTerakhirDilihat,
} from "@/lib/notification";
import type { Notifikasi, TingkatNotifikasi } from "@/types/notification";

const GAYA: Record<TingkatNotifikasi, { warna: string; latar: string }> = {
    perlu_tindakan: { warna: "text-amber-600", latar: "bg-amber-50" },
    baik: { warna: "text-green-600", latar: "bg-green-50" },
    info: { warna: "text-brand-blue", latar: "bg-blue-50" },
};

function IkonTingkat({ tingkat }: { tingkat: TingkatNotifikasi }) {
    if (tingkat === "perlu_tindakan")
        return <AlertCircle size={15} className="shrink-0 text-amber-600" />;
    if (tingkat === "baik")
        return <CheckCircle2 size={15} className="shrink-0 text-green-600" />;
    return <Info size={15} className="shrink-0 text-brand-blue" />;
}

function waktuRelatif(iso: string) {
    const selisih = Date.now() - new Date(iso).getTime();
    const menit = Math.round(selisih / 60000);

    if (menit < 1) return "baru saja";
    if (menit < 60) return `${menit} menit lalu`;

    const jam = Math.round(menit / 60);
    if (jam < 24) return `${jam} jam lalu`;

    const hari = Math.round(jam / 24);
    if (hari < 30) return `${hari} hari lalu`;

    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

/**
 * Panel notifikasi.
 *
 * Isinya diturunkan dari keadaan data terkini di server, jadi tidak
 * ada status "sudah dibaca" di basis data. Penanda belum dibaca
 * dihitung dari waktu terakhir panel ini dibuka, yang disimpan di
 * peramban.
 */
export function PanelNotifikasi({ aksen }: { aksen: string }) {
    const [terbuka, setTerbuka] = useState(false);
    const [daftar, setDaftar] = useState<Notifikasi[]>([]);
    const [perluTindakan, setPerluTindakan] = useState(0);
    const [memuat, setMemuat] = useState(true);
    const [dilihat, setDilihat] = useState(0);

    const wadah = useRef<HTMLDivElement>(null);

    const muat = useCallback(async () => {
        try {
            const hasil = await ambilNotifikasi();
            setDaftar(hasil.notifikasi);
            setPerluTindakan(hasil.perluTindakan);
        } catch {
            setDaftar([]);
        } finally {
            setMemuat(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        muat();
        setDilihat(waktuTerakhirDilihat());
    }, [muat]);

    // Tutup saat mengklik di luar panel
    useEffect(() => {
        if (!terbuka) return;

        function klikLuar(e: MouseEvent) {
            if (wadah.current && !wadah.current.contains(e.target as Node)) {
                setTerbuka(false);
            }
        }

        document.addEventListener("mousedown", klikLuar);
        return () => document.removeEventListener("mousedown", klikLuar);
    }, [terbuka]);

    function buka() {
        const kondisiBaru = !terbuka;
        setTerbuka(kondisiBaru);

        if (kondisiBaru) {
            tandaiSudahDilihat();
            // Nilai lama dipertahankan selama panel terbuka supaya
            // penanda "baru" tidak langsung hilang di depan mata
            window.setTimeout(() => setDilihat(Date.now()), 1500);
        }
    }

    const belumDilihat = daftar.filter(
        (n) => new Date(n.waktu).getTime() > dilihat
    ).length;

    const lencana = perluTindakan > 0 ? perluTindakan : belumDilihat;

    return (
        <div ref={wadah} className="relative">
            <button
                onClick={buka}
                aria-label={`Notifikasi${lencana > 0 ? `, ${lencana} baru` : ""}`}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-paper-soft text-ink-soft transition hover:bg-slate-100"
            >
                <Bell size={18} />

                {lencana > 0 && (
                    <span
                        className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                        style={{ backgroundColor: perluTindakan > 0 ? "#D97706" : aksen }}
                    >
                        {lencana > 9 ? "9+" : lencana}
                    </span>
                )}
            </button>

            {terbuka && (
                <div className="absolute right-0 top-12 z-50 max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                            <h3 className="font-display text-sm font-bold text-ink">Notifikasi</h3>
                            {perluTindakan > 0 && (
                                <p className="text-xs text-amber-600">
                                    {perluTindakan} perlu tindakan
                                </p>
                            )}
                        </div>

                        <button
                            onClick={() => setTerbuka(false)}
                            aria-label="Tutup"
                            className="rounded-lg p-1 text-ink-soft transition hover:bg-paper-soft"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="max-h-[calc(70vh-3.5rem)] overflow-y-auto">
                        {memuat ? (
                            <div className="space-y-2 p-4">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="h-14 animate-pulse rounded-lg bg-slate-100"
                                    />
                                ))}
                            </div>
                        ) : daftar.length === 0 ? (
                            <div className="px-4 py-10 text-center">
                                <Bell size={22} className="mx-auto text-ink-soft" />
                                <p className="mt-2 text-sm text-ink-soft">
                                    Belum ada notifikasi
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {daftar.map((n) => {
                                    const baru = new Date(n.waktu).getTime() > dilihat;

                                    return (
                                        <Link
                                            key={n.id}
                                            href={n.tautan}
                                            onClick={() => setTerbuka(false)}
                                            className={`flex gap-3 px-4 py-3 transition hover:bg-paper-soft ${baru ? GAYA[n.tingkat].latar : ""
                                                }`}
                                        >
                                            <IkonTingkat tingkat={n.tingkat} />

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-ink">
                                                        {n.judul}
                                                    </span>
                                                    {baru && (
                                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                                                    )}
                                                </div>

                                                <p className="mt-0.5 text-xs text-ink-soft">
                                                    {n.pesan}
                                                </p>

                                                <p className="mt-1 text-[11px] text-ink-soft">
                                                    {waktuRelatif(n.waktu)}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}