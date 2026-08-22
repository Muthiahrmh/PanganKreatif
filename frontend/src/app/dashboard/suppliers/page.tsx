"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Package, Award, ShoppingCart, Store, Truck } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatNumber, formatRupiah } from "@/lib/format";

interface Pengiriman {
    km: number;
    samaKota: boolean;
    estimasi: { hari: number; label: string; catatan: string };
}

interface Penawaran {
    produkId: string;
    pemasokId: string | null;
    pemasok: string;
    kota: string | null;
    harga: number;
    hargaGrosir: number | null;
    minGrosir: number | null;
    stok: number;
    adaPesananTerbuka: boolean;
    pengiriman: Pengiriman | null;
}

interface Komoditas {
    nama: string;
    satuan: string;
    kategori: string;
    penawaran: Penawaran[];
    termurah: number;
    termahal: number;
    jumlahPemasok: number;
    selisihHarga: number;
}

interface Katalog {
    kotaPembeli: string | null;
    kategori: string[];
    kota: string[];
    komoditas: Komoditas[];
}

/**
 * Perbandingan pemasok.
 *
 * Pengelompokan per komoditas dan penyaringan dikerjakan di server,
 * jadi browser tidak menerima ratusan produk lalu menyusunnya
 * sendiri. Yang dikirim hanya kolom yang benar-benar ditampilkan.
 */
export default function SuppliersPage() {
    const user = useAuthStore((s) => s.user);

    const [data, setData] = useState<Katalog | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [cariAktif, setCariAktif] = useState("");
    const [category, setCategory] = useState("all");
    const [city, setCity] = useState("all");
    const [urutan, setUrutan] = useState<"harga" | "jarak">("harga");

    const load = useCallback(async () => {
        try {
            const res = await api.get<Katalog>("/products/katalog", {
                params: {
                    ...(cariAktif ? { q: cariAktif } : {}),
                    category,
                    city,
                },
            });
            setData(res.data);
            setError(null);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [cariAktif, category, city]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    // Pencarian ditunda sejenak supaya tidak memanggil server tiap ketukan
    useEffect(() => {
        const jeda = window.setTimeout(() => setCariAktif(query.trim()), 400);
        return () => window.clearTimeout(jeda);
    }, [query]);

    if (user && user.role !== "umkm") {
        return (
            <p className="text-sm text-ink-soft">
                Halaman ini untuk akun UMKM yang mencari pemasok.
            </p>
        );
    }

    function urutkan(penawaran: Penawaran[]) {
        return [...penawaran].sort((a, b) => {
            if (urutan === "jarak") {
                const ja = a.pengiriman?.km ?? Number.POSITIVE_INFINITY;
                const jb = b.pengiriman?.km ?? Number.POSITIVE_INFINITY;
                if (ja !== jb) return ja - jb;
            }
            return a.harga - b.harga;
        });
    }

    const komoditas = data?.komoditas ?? [];

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h2 className="font-display text-xl font-bold text-ink">Cari Pemasok</h2>
                <p className="mt-1 text-sm text-ink-soft">
                    Bandingkan harga, stok, jarak, dan estimasi pengiriman sebelum memutuskan mau
                    ambil dari siapa.
                    {data?.kotaPembeli && ` Jarak dihitung dari ${data.kotaPembeli}.`}
                </p>
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="grid gap-3 rounded-xl border border-ink/5 bg-white p-4 sm:grid-cols-[1fr_auto_auto_auto]">
                <label className="relative block">
                    <Search
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
                    />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari bahan baku atau nama pemasok"
                        className="w-full rounded-lg border border-ink/10 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                    />
                </label>

                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="Filter kategori"
                    className="rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none transition focus:border-brand-blue"
                >
                    <option value="all">Semua kategori</option>
                    {(data?.kategori ?? []).map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>

                <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    aria-label="Filter kota"
                    className="rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none transition focus:border-brand-blue"
                >
                    <option value="all">Semua kota</option>
                    {(data?.kota ?? []).map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>

                <select
                    value={urutan}
                    onChange={(e) => setUrutan(e.target.value as "harga" | "jarak")}
                    aria-label="Urutkan penawaran"
                    className="rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none transition focus:border-brand-blue"
                >
                    <option value="harga">Termurah dulu</option>
                    <option value="jarak">Terdekat dulu</option>
                </select>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                </div>
            ) : komoditas.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink/15 bg-white p-10 text-center">
                    <Store size={26} className="mx-auto text-ink-soft" />
                    <h3 className="mt-3 font-display text-base font-bold text-ink">
                        Tidak ada pemasok yang cocok
                    </h3>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
                        Coba ubah kata kunci atau lepas filter kategori dan kota.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {komoditas.map((g) => {
                        const daftar = urutkan(g.penawaran);
                        const hematPersen =
                            g.termahal > 0 ? Math.round((g.selisihHarga / g.termahal) * 100) : 0;

                        return (
                            <div
                                key={`${g.nama}-${g.satuan}`}
                                className="overflow-hidden rounded-xl border border-ink/5 bg-white"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                                    <div>
                                        <h3 className="font-display text-base font-bold text-ink">
                                            {g.nama}
                                        </h3>
                                        <p className="mt-0.5 text-xs text-ink-soft">
                                            {g.kategori} · {g.jumlahPemasok} pemasok
                                        </p>
                                    </div>

                                    {g.jumlahPemasok > 1 && g.selisihHarga > 0 && (
                                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                                            Hemat sampai {formatRupiah(g.selisihHarga)}/{g.satuan} (
                                            {hematPersen}%)
                                        </span>
                                    )}
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {daftar.map((o, idx) => {
                                        const teratas = idx === 0 && daftar.length > 1;

                                        return (
                                            <div
                                                key={o.produkId}
                                                className={`flex flex-wrap items-center justify-between gap-4 px-5 py-4 ${teratas ? "bg-green-50/40" : ""
                                                    }`}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-medium text-ink">
                                                            {o.pemasok}
                                                        </span>

                                                        {teratas && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-green px-2 py-0.5 text-[11px] font-medium text-white">
                                                                <Award size={11} />
                                                                {urutan === "jarak"
                                                                    ? "Terdekat"
                                                                    : "Termurah"}
                                                            </span>
                                                        )}

                                                        {o.adaPesananTerbuka && (
                                                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-brand-blue">
                                                                Ada order kolektif
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPin size={12} />
                                                            {o.kota ?? "-"}
                                                        </span>

                                                        <span className="inline-flex items-center gap-1">
                                                            <Package size={12} />
                                                            stok {formatNumber(o.stok)} {g.satuan}
                                                        </span>

                                                        {o.pengiriman && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <Truck size={12} />
                                                                {o.pengiriman.samaKota
                                                                    ? "dalam kota"
                                                                    : `${o.pengiriman.km} km`}
                                                                {" · "}
                                                                {o.pengiriman.estimasi.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div
                                                        className={`font-display text-lg font-bold ${teratas ? "text-brand-green" : "text-ink"
                                                            }`}
                                                    >
                                                        {formatRupiah(o.harga)}
                                                    </div>
                                                    <div className="text-xs text-ink-soft">
                                                        per {g.satuan}
                                                    </div>
                                                    {o.hargaGrosir && o.minGrosir && (
                                                        <div className="text-xs text-brand-green">
                                                            grosir {formatRupiah(o.hargaGrosir)} min{" "}
                                                            {o.minGrosir}
                                                        </div>
                                                    )}
                                                </div>

                                                {o.adaPesananTerbuka ? (
                                                    <Link
                                                        href="/dashboard/procurement"
                                                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-blue px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
                                                    >
                                                        <ShoppingCart size={14} /> Gabung
                                                    </Link>
                                                ) : (
                                                    <span className="shrink-0 rounded-lg bg-paper-soft px-3 py-2 text-xs text-ink-soft">
                                                        Belum ada order
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}