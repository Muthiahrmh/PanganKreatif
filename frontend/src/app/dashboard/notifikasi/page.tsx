"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Info, Bell } from "lucide-react";
import { ambilNotifikasi, tandaiSudahDilihat } from "@/lib/notification";
import type { Notifikasi, TingkatNotifikasi } from "@/types/notification";

const GAYA: Record<TingkatNotifikasi, { warna: string; latar: string }> = {
    perlu_tindakan: { warna: "text-amber-600", latar: "bg-amber-50" },
    baik: { warna: "text-green-600", latar: "bg-green-50" },
    info: { warna: "text-brand-blue", latar: "bg-blue-50" },
};

const URUTAN_KATEGORI: TingkatNotifikasi[] = ["perlu_tindakan", "baik", "info"];

const LABEL_KATEGORI: Record<TingkatNotifikasi, string> = {
    perlu_tindakan: "Perlu Tindakan",
    baik: "Kabar Baik",
    info: "Informasi",
};

function IkonTingkat({ tingkat, size = 16 }: { tingkat: TingkatNotifikasi; size?: number }) {
    if (tingkat === "perlu_tindakan")
        return <AlertCircle size={size} className="shrink-0 text-amber-600" />;
    if (tingkat === "baik")
        return <CheckCircle2 size={size} className="shrink-0 text-green-600" />;
    return <Info size={size} className="shrink-0 text-brand-blue" />;
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

export default function HalamanNotifikasi() {
    const [daftar, setDaftar] = useState<Notifikasi[]>([]);
    const [memuat, setMemuat] = useState(true);

    useEffect(() => {
        // Tandai sudah dilihat begitu halaman ini dibuka — badge di
        // navbar akan hilang setelah ini
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

    // Dikelompokkan per tingkat. Urutan dan isi tiap notifikasi sudah
    // diurutkan dari backend (perlu tindakan lebih dulu, lalu terbaru),
    // jadi di sini tinggal dipisah per kelompok tanpa mengubah urutannya.
    const kelompok = URUTAN_KATEGORI.map((tingkat) => ({
        tingkat,
        item: daftar.filter((n) => n.tingkat === tingkat),
    })).filter((k) => k.item.length > 0);

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <div className="mb-6">
                <h1 className="font-display text-xl font-bold text-ink">Notifikasi</h1>
                <p className="mt-1 text-sm text-ink-soft">
                    {daftar.length > 0
                        ? `${daftar.length} notifikasi`
                        : "Belum ada notifikasi"}
                </p>
            </div>

            {memuat ? (
                <div className="space-y-2">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                </div>
            ) : daftar.length === 0 ? (
                <div className="rounded-2xl border border-ink/10 py-16 text-center">
                    <Bell size={24} className="mx-auto text-ink-soft" />
                    <p className="mt-2 text-sm text-ink-soft">Belum ada notifikasi</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {kelompok.map(({ tingkat, item }) => (
                        <div key={tingkat}>
                            <div className="mb-3 flex items-center gap-2">
                                <IkonTingkat tingkat={tingkat} size={15} />
                                <h2
                                    className={`text-sm font-bold ${GAYA[tingkat].warna}`}
                                >
                                    {LABEL_KATEGORI[tingkat]}
                                </h2>
                                <span className="text-xs text-ink-soft">
                                    ({item.length})
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-ink/10 bg-white">
                                {item.map((n) => (
                                    <Link
                                        key={n.id}
                                        href={n.tautan}
                                        className={`flex gap-3 px-4 py-3 transition hover:bg-paper-soft ${GAYA[n.tingkat].latar}`}
                                    >
                                        <IkonTingkat tingkat={n.tingkat} />

                                        <div className="min-w-0">
                                            <span className="text-sm font-medium text-ink">
                                                {n.judul}
                                            </span>
                                            <p className="mt-0.5 text-xs text-ink-soft">
                                                {n.pesan}
                                            </p>
                                            <p className="mt-1 text-[11px] text-ink-soft">
                                                {waktuRelatif(n.waktu)}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}