"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { Search, MapPin, Package, Award, ShoppingCart, Store, Truck, Building2, ChevronLeft, ChevronRight, ChevronDown, Check, Sparkles } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { temaPeran } from "@/components/dashboard/roleTheme";
import { formatNumber, formatRupiah } from "@/lib/format";

interface Pengiriman {
    km: number;
    samaKota: boolean;
    /** true = dihitung dari alamat asli (geocoding), false = perkiraan titik-pusat-kota */
    presisi: boolean;
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

const ITEMS_PER_PAGE = 5;

export default function SuppliersPage() {
    const user = useAuthStore((s) => s.user);
    const tema = temaPeran(user?.role ?? "umkm");
    const warnaPeran = {
        "--warna-peran": tema.aksen,
        "--warna-peran-latar": tema.latar,
        "--warna-gelap": tema.sidebar,
    } as CSSProperties;

    const [data, setData] = useState<Katalog | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [cariAktif, setCariAktif] = useState("");
    const [category, setCategory] = useState("all");
    const [city, setCity] = useState("all");
    const [urutan, setUrutan] = useState<"harga" | "jarak">("harga");
    const [currentPage, setCurrentPage] = useState(1);

    const [catDropdownOpen, setCatDropdownOpen] = useState(false);
    const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

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
            setCurrentPage(1);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [cariAktif, category, city]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const jeda = window.setTimeout(() => setCariAktif(query.trim()), 400);
        return () => window.clearTimeout(jeda);
    }, [query]);

    if (user && user.role !== "umkm") {
        return (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-500 shadow-sm">
                Halaman ini khusus untuk akun UMKM yang mencari pemasok bahan baku.
            </div>
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
    const totalPages = Math.ceil(komoditas.length / ITEMS_PER_PAGE);
    const paginatedKomoditas = komoditas.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="flex flex-col gap-6 md:gap-8 pb-12" style={warnaPeran}>
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[var(--warna-gelap)] via-[var(--warna-gelap)] to-[var(--warna-peran)] p-6 sm:p-10 text-white shadow-2xl shadow-black/10">
                <div
                    className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-[70px]"
                    style={{ backgroundColor: "var(--warna-peran)", opacity: 0.4 }}
                />
                <div
                    className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full blur-[60px]"
                    style={{ backgroundColor: "var(--warna-peran)", opacity: 0.2 }}
                />
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                        <Building2 size={14} /> B2B Supply Chain & Collective Procurement
                    </div>
                    <h2 className="mt-4 font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
                        Cari & Bandingkan Pemasok
                    </h2>
                    <p className="mt-2 text-sm font-medium text-white/70 max-w-2xl leading-relaxed">
                        Hubungkan kebutuhan stok Anda langsung dengan kelompok tani dan distributor mitra. Nikmati akses harga grosir melalui mekanisme pengadaan kolektif.
                        {data?.kotaPembeli && ` (Jarak dihitung dari ${data.kotaPembeli}).`}
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 shadow-sm">
                    {error}
                </div>
            )}

            <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:grid-cols-[1fr_200px_200px_200px] relative z-30">
                <label className="relative block">
                    <Search
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari bahan baku atau nama kelompok tani..."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[var(--warna-peran)] focus:bg-white focus:ring-1 focus:ring-[var(--warna-peran)]"
                    />
                </label>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setCatDropdownOpen(!catDropdownOpen);
                            setCityDropdownOpen(false);
                            setSortDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-sm font-semibold outline-none transition-all ${catDropdownOpen
                                ? "border-[var(--warna-peran)] bg-white ring-1 ring-[var(--warna-peran)] text-slate-900"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                            }`}
                    >
                        <span className="truncate">
                            {category === "all" ? "Semua Kategori" : category}
                        </span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${catDropdownOpen ? "rotate-180 text-[var(--warna-peran)]" : ""}`} />
                    </button>

                    {catDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setCatDropdownOpen(false)} />
                            <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-full max-h-60 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] ring-1 ring-slate-900/5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCategory("all");
                                        setCatDropdownOpen(false);
                                    }}
                                    className={`w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors flex items-center justify-between ${category === "all" ? "bg-[var(--warna-peran-latar)] text-[var(--warna-peran)] font-bold" : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    <span>Semua Kategori</span>
                                    {category === "all" && <Check size={14} className="text-[var(--warna-peran)]" />}
                                </button>
                                {(data?.kategori ?? []).map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                            setCategory(c);
                                            setCatDropdownOpen(false);
                                        }}
                                        className={`w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors flex items-center justify-between ${category === c ? "bg-[var(--warna-peran-latar)] text-[var(--warna-peran)] font-bold" : "text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        <span>{c}</span>
                                        {category === c && <Check size={14} className="text-[var(--warna-peran)]" />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setCityDropdownOpen(!cityDropdownOpen);
                            setCatDropdownOpen(false);
                            setSortDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-sm font-semibold outline-none transition-all ${cityDropdownOpen
                                ? "border-[var(--warna-peran)] bg-white ring-1 ring-[var(--warna-peran)] text-slate-900"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                            }`}
                    >
                        <span className="truncate">
                            {city === "all" ? "Semua Kota" : city}
                        </span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${cityDropdownOpen ? "rotate-180 text-[var(--warna-peran)]" : ""}`} />
                    </button>

                    {cityDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setCityDropdownOpen(false)} />
                            <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-full max-h-60 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] ring-1 ring-slate-900/5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCity("all");
                                        setCityDropdownOpen(false);
                                    }}
                                    className={`w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors flex items-center justify-between ${city === "all" ? "bg-[var(--warna-peran-latar)] text-[var(--warna-peran)] font-bold" : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    <span>Semua Kota</span>
                                    {city === "all" && <Check size={14} className="text-[var(--warna-peran)]" />}
                                </button>
                                {(data?.kota ?? []).map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                            setCity(c);
                                            setCityDropdownOpen(false);
                                        }}
                                        className={`w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors flex items-center justify-between ${city === c ? "bg-[var(--warna-peran-latar)] text-[var(--warna-peran)] font-bold" : "text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        <span>{c}</span>
                                        {city === c && <Check size={14} className="text-[var(--warna-peran)]" />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setSortDropdownOpen(!sortDropdownOpen);
                            setCatDropdownOpen(false);
                            setCityDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-sm font-semibold outline-none transition-all ${sortDropdownOpen
                                ? "border-[var(--warna-peran)] bg-white ring-1 ring-[var(--warna-peran)] text-slate-900"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                            }`}
                    >
                        <span className="truncate">
                            {urutan === "harga" ? "Termurah Dahulu" : "Terdekat Dahulu"}
                        </span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${sortDropdownOpen ? "rotate-180 text-[var(--warna-peran)]" : ""}`} />
                    </button>

                    {sortDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setSortDropdownOpen(false)} />
                            <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-full rounded-2xl border border-slate-100 bg-white p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] ring-1 ring-slate-900/5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUrutan("harga");
                                        setSortDropdownOpen(false);
                                    }}
                                    className={`w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors flex items-center justify-between ${urutan === "harga" ? "bg-[var(--warna-peran-latar)] text-[var(--warna-peran)] font-bold" : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    <span>Termurah Dahulu</span>
                                    {urutan === "harga" && <Check size={14} className="text-[var(--warna-peran)]" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUrutan("jarak");
                                        setSortDropdownOpen(false);
                                    }}
                                    className={`w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors flex items-center justify-between ${urutan === "jarak" ? "bg-[var(--warna-peran-latar)] text-[var(--warna-peran)] font-bold" : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    <span>Terdekat Dahulu</span>
                                    {urutan === "jarak" && <Check size={14} className="text-[var(--warna-peran)]" />}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-40 animate-pulse rounded-3xl bg-slate-100" />
                    ))}
                </div>
            ) : komoditas.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                    <Store size={36} className="mx-auto text-slate-400 mb-3" />
                    <h3 className="font-display text-base font-bold text-slate-800">
                        Tidak ada pemasok yang cocok
                    </h3>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 leading-relaxed">
                        Coba ubah kata kunci pencarian atau sesuaikan filter kategori dan kota Anda.
                    </p>
                </div>
            ) : (
                <div className="space-y-6 relative z-10">
                    {paginatedKomoditas.map((g) => {
                        const daftar = urutkan(g.penawaran);
                        const hematPersen =
                            g.termahal > 0 ? Math.round((g.selisihHarga / g.termahal) * 100) : 0;

                        return (
                            <div
                                key={`${g.nama}-${g.satuan}`}
                                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 bg-slate-50/50">
                                    <div>
                                        <h3 className="font-display text-lg font-extrabold text-slate-900 tracking-tight">
                                            {g.nama}
                                        </h3>
                                        <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                            {g.kategori} · Tersedia dari {g.jumlahPemasok} kelompok tani & distributor mitra
                                        </p>
                                    </div>

                                    {g.jumlahPemasok > 1 && g.selisihHarga > 0 && (
                                        <span className="rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60 shadow-sm flex items-center gap-1">
                                            <Sparkles size={12} /> Hemat hingga {formatRupiah(g.selisihHarga)}/{g.satuan} ({hematPersen}%)
                                        </span>
                                    )}
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {daftar.map((o, idx) => {
                                        const teratas = idx === 0 && daftar.length > 1;

                                        return (
                                            <div
                                                key={o.produkId}
                                                className={`flex flex-wrap items-center justify-between gap-4 px-6 py-5 transition hover:bg-slate-50/80 ${teratas ? "bg-emerald-50/30" : ""
                                                    }`}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2.5">
                                                        <span className="font-bold text-slate-900 text-base">
                                                            {o.pemasok}
                                                        </span>

                                                        {teratas && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-0.5 text-[11px] font-bold text-white shadow-sm">
                                                                <Award size={12} />
                                                                {urutan === "jarak" ? "Paling Dekat" : "Paling Hemat"}
                                                            </span>
                                                        )}

                                                        {o.adaPesananTerbuka && (
                                                            <span className="rounded-full bg-[var(--warna-peran-latar)] px-3 py-0.5 text-[11px] font-bold text-[var(--warna-peran)] border border-[var(--warna-peran)]/30">
                                                                Sesi Collective Procurement Aktif
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-medium text-slate-500">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <MapPin size={13} className="text-slate-400" />
                                                            {o.kota ?? "-"}
                                                        </span>

                                                        <span className="inline-flex items-center gap-1.5">
                                                            <Package size={13} className="text-slate-400" />
                                                            Stok tersedia: <strong className="text-slate-700">{formatNumber(o.stok)} {g.satuan}</strong>
                                                        </span>

                                                        {o.pengiriman && (
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <Truck size={13} className="text-slate-400" />
                                                                {o.pengiriman.samaKota && !o.pengiriman.presisi
                                                                    ? "Pengiriman dalam kota"
                                                                    : `Jarak ${o.pengiriman.presisi ? "" : "±"}${o.pengiriman.km} km`}
                                                                {" · "}
                                                                <strong className="text-slate-700">{o.pengiriman.estimasi.label}</strong>
                                                                {o.pengiriman.presisi && (
                                                                    <span
                                                                        title="Dihitung dari alamat asli, bukan perkiraan kota"
                                                                        className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600"
                                                                    >
                                                                        presisi
                                                                    </span>
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div
                                                        className={`font-display text-xl font-black ${teratas ? "text-emerald-600" : "text-slate-900"
                                                            }`}
                                                    >
                                                        {formatRupiah(o.harga)}
                                                    </div>
                                                    <div className="text-xs font-medium text-slate-400">
                                                        per {g.satuan}
                                                    </div>
                                                    {o.hargaGrosir && o.minGrosir && (
                                                        <div className="text-xs font-bold text-emerald-600 mt-0.5">
                                                            Harga Grosir {formatRupiah(o.hargaGrosir)} (Min. {o.minGrosir} {g.satuan})
                                                        </div>
                                                    )}
                                                </div>

                                                {o.adaPesananTerbuka ? (
                                                    <Link
                                                        href="/dashboard/procurement"
                                                        className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[var(--warna-peran)] px-5 py-3 text-xs font-bold text-white shadow-md transition hover:brightness-90"
                                                    >
                                                        <ShoppingCart size={15} /> Gabung Pesanan Kolektif
                                                    </Link>
                                                ) : (
                                                    <span className="shrink-0 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-semibold text-slate-400">
                                                        Belum ada sesi
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <div className="text-xs font-medium text-slate-500">
                                Menampilkan halaman <strong className="text-slate-800">{currentPage}</strong> dari <strong className="text-slate-800">{totalPages}</strong> (Total {komoditas.length} komoditas)
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={15} /> Sebelumnya
                                </button>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Berikutnya <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}