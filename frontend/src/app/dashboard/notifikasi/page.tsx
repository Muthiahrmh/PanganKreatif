"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Info, Bell, ArrowRight } from "lucide-react";
import { ambilNotifikasi, tandaiSudahDilihat } from "@/lib/notification";
import type { Notifikasi, TingkatNotifikasi } from "@/types/notification";
import { useAuthStore } from "@/store/authStore";
import { temaPeran } from "@/components/dashboard/roleTheme";

const GAYA: Record<TingkatNotifikasi, { warna: string; latar: string; border: string }> = {
    perlu_tindakan: { warna: "text-amber-700", latar: "bg-amber-50/60 hover:bg-amber-50", border: "border-amber-100" },
    baik: { warna: "text-emerald-700", latar: "bg-emerald-50/60 hover:bg-emerald-50", border: "border-emerald-100" },
    info: { warna: "text-blue-700", latar: "bg-blue-50/60 hover:bg-blue-50", border: "border-blue-100" },
};

const LABEL_KATEGORI: Record<TingkatNotifikasi, string> = {
    perlu_tindakan: "Perlu Tindakan",
    baik: "Kabar Baik",
    info: "Informasi",
};

function IkonTingkat({ tingkat, size = 18 }: { tingkat: TingkatNotifikasi; size?: number }) {
    if (tingkat === "perlu_tindakan")
        return <AlertCircle size={size} className="shrink-0 text-amber-600 mt-0.5" />;
    if (tingkat === "baik")
        return <CheckCircle2 size={size} className="shrink-0 text-emerald-600 mt-0.5" />;
    return <Info size={size} className="shrink-0 text-blue-600 mt-0.5" />;
}

function waktuRelatif(iso: string) {
    const selisih = Date.now() - new Date(iso).getTime();
    const menit = Math.round(selisih / 60000);

    if (menit < 1) return "Baru saja";
    if (menit < 60) return `${menit} menit lalu`;

    const jam = Math.round(menit / 60);
    if (jam < 24) return `${jam} jam lalu`;

    const hari = Math.round(jam / 24);
    if (hari < 30) return `${hari} hari lalu`;

    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function HalamanNotifikasi() {
    const user = useAuthStore((s) => s.user);
    const tema = temaPeran(user?.role);
    const warnaPeran = {
        "--warna-peran": tema.aksen,
        "--warna-peran-latar": tema.latar,
        "--warna-gelap": tema.sidebar,
    } as CSSProperties;

    const [daftar, setDaftar] = useState<Notifikasi[]>([]);
    const [memuat, setMemuat] = useState(true);
    const [filterAktif, setFilterAktif] = useState<"semua" | TingkatNotifikasi>("semua");

    useEffect(() => {
        tandaiSudahDilihat();

        (async () => {
            try {
                const hasil = await ambilNotifikasi();
                setDaftar(hasil.notifikasi);
            } catch {
                setDaftar([]);
            } finally {
                setMemuat(false);
            }
        })();
    }, []);

    // Filter daftar berdasarkan tab yang dipilih di atas
    const daftarTampil = filterAktif === "semua"
        ? daftar
        : daftar.filter((n) => n.tingkat === filterAktif);

    // Hitung jumlah per kategori untuk badge di tombol tab
    const jumlahSemua = daftar.length;
    const jumlahPerluTindakan = daftar.filter(n => n.tingkat === "perlu_tindakan").length;
    const jumlahBaik = daftar.filter(n => n.tingkat === "baik").length;
    const jumlahInfo = daftar.filter(n => n.tingkat === "info").length;

    return (
        // Disamakan dengan pola bungkus halaman dashboard lain (orders,
        // transactions, dst): full-width mengikuti <main>, bukan kolom
        // sempit mx-auto max-w-3xl sendiri — sebelumnya ini yang bikin
        // halaman notifikasi kelihatan beda/kosong dibanding yang lain.
        <div className="flex flex-col gap-6 md:gap-8 pb-10" style={warnaPeran}>
            {/* Hero Header — gradasi gelap bernuansa warna peran */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[var(--warna-gelap)] via-[var(--warna-gelap)] to-[var(--warna-peran)] p-6 sm:p-10 text-white shadow-2xl shadow-black/10">
                <div
                    className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-[70px]"
                    style={{ backgroundColor: "var(--warna-peran)", opacity: 0.4 }}
                />
                <div
                    className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full blur-[60px]"
                    style={{ backgroundColor: "var(--warna-peran)", opacity: 0.2 }}
                />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                            Pusat Pemberitahuan
                        </div>
                        <h1 className="mt-4 font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
                            Notifikasi Anda
                        </h1>
                        <p className="mt-2 text-sm font-medium text-white/70">
                            Pilih kategori di bawah untuk menyaring informasi penting secara instan.
                        </p>
                    </div>

                    <div className="shrink-0">
                        <span className="inline-flex items-center rounded-2xl bg-white/10 border border-white/15 px-4 py-2 text-xs font-extrabold text-white backdrop-blur-sm">
                            {jumlahSemua} Total Pesan
                        </span>
                    </div>
                </div>
            </div>

            {/* TAB FILTER DI ATAS (Biar gak perlu scroll jauh) — "Filter Tab
                ala iOS" yang sama polanya dengan halaman Pesanan/Transaksi */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-200/70 p-1.5 shadow-inner">
                <button
                    onClick={() => setFilterAktif("semua")}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${filterAktif === "semua"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    Semua ({jumlahSemua})
                </button>
                <button
                    onClick={() => setFilterAktif("perlu_tindakan")}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${filterAktif === "perlu_tindakan"
                            ? "bg-white text-amber-700 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    Perlu Tindakan ({jumlahPerluTindakan})
                </button>
                <button
                    onClick={() => setFilterAktif("baik")}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${filterAktif === "baik"
                            ? "bg-white text-emerald-700 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    Kabar Baik ({jumlahBaik})
                </button>
                <button
                    onClick={() => setFilterAktif("info")}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${filterAktif === "info"
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    Informasi ({jumlahInfo})
                </button>
            </div>

            {memuat ? (
                <div className="space-y-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-24 animate-pulse rounded-3xl bg-slate-100" />
                    ))}
                </div>
            ) : daftarTampil.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
                        <Bell size={28} />
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-800">Tidak ada notifikasi dalam kategori ini</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 leading-relaxed">
                        Coba pilih tab kategori lain di atas untuk melihat pemberitahuan yang tersedia.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {daftarTampil.map((n) => (
                        <Link
                            key={n.id}
                            href={n.tautan}
                            className={`group flex items-start justify-between gap-4 rounded-2xl border p-5 transition-all duration-200 hover:shadow-md ${GAYA[n.tingkat].latar} ${GAYA[n.tingkat].border} bg-white`}
                        >
                            <div className="flex items-start gap-4 min-w-0">
                                <div className="rounded-xl p-2.5 bg-white shadow-sm border border-slate-100 shrink-0">
                                    <IkonTingkat tingkat={n.tingkat} size={20} />
                                </div>

                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-bold text-slate-900 group-hover:text-[var(--warna-peran)] transition-colors">
                                            {n.judul}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                                        {n.pesan}
                                    </p>
                                    <div className="mt-2.5 flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                                        <span>{waktuRelatif(n.waktu)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 self-center text-slate-300 group-hover:text-[var(--warna-peran)] transition-colors transform group-hover:translate-x-1">
                                <ArrowRight size={18} />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}