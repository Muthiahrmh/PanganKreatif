"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Package, Award, ShoppingCart, Store } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatNumber, formatRupiah, toNumber } from "@/lib/format";

interface CatalogProduct {
    id: string;
    name: string;
    category: string;
    unit: string;
    price: string | number;
    stock: number;
    supplier: {
        id: string;
        groupName: string;
        city: string;
        address: string;
    };
}

interface OpenOrder {
    id: string;
    productId: string;
    status: string;
    deadline: string;
}

/** Satu komoditas dengan daftar pemasok yang menjualnya */
interface CommodityGroup {
    name: string;
    unit: string;
    category: string;
    offers: {
        product: CatalogProduct;
        price: number;
        hasOpenOrder: boolean;
    }[];
    cheapest: number;
    priciest: number;
}

export default function SuppliersPage() {
    const user = useAuthStore((s) => s.user);

    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("all");
    const [city, setCity] = useState("all");

    const load = useCallback(async () => {
        try {
            const [prodRes, orderRes] = await Promise.all([
                api.get<CatalogProduct[]>("/products"),
                api.get<OpenOrder[]>("/procurement/orders", { params: { status: "open" } }),
            ]);
            setProducts(prodRes.data);
            setOpenOrders(orderRes.data);
            setError(null);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const categories = useMemo(
        () => Array.from(new Set(products.map((p) => p.category))).sort(),
        [products]
    );

    const cities = useMemo(
        () => Array.from(new Set(products.map((p) => p.supplier?.city).filter(Boolean))).sort(),
        [products]
    );

    const productIdsWithOpenOrder = useMemo(
        () => new Set(openOrders.map((o) => o.productId)),
        [openOrders]
    );

    /** Kelompokkan per nama komoditas supaya bisa dibandingkan antar pemasok */
    const groups = useMemo<CommodityGroup[]>(() => {
        const filtered = products.filter((p) => {
            if (category !== "all" && p.category !== category) return false;
            if (city !== "all" && p.supplier?.city !== city) return false;
            if (query.trim()) {
                const q = query.toLowerCase();
                const inName = p.name.toLowerCase().includes(q);
                const inSupplier = (p.supplier?.groupName ?? "").toLowerCase().includes(q);
                if (!inName && !inSupplier) return false;
            }
            return true;
        });

        const map = new Map<string, CommodityGroup>();

        for (const p of filtered) {
            const key = `${p.name.toLowerCase()}|${p.unit}`;
            const price = toNumber(p.price);

            const group = map.get(key) ?? {
                name: p.name,
                unit: p.unit,
                category: p.category,
                offers: [],
                cheapest: Number.POSITIVE_INFINITY,
                priciest: 0,
            };

            group.offers.push({
                product: p,
                price,
                hasOpenOrder: productIdsWithOpenOrder.has(p.id),
            });
            group.cheapest = Math.min(group.cheapest, price);
            group.priciest = Math.max(group.priciest, price);

            map.set(key, group);
        }

        return Array.from(map.values())
            .map((g) => ({
                ...g,
                offers: g.offers.sort((a, b) => a.price - b.price),
            }))
            .sort((a, b) => b.offers.length - a.offers.length || a.name.localeCompare(b.name));
    }, [products, query, category, city, productIdsWithOpenOrder]);

    if (user && user.role !== "umkm") {
        return (
            <p className="text-sm text-ink-soft">
                Halaman ini untuk akun UMKM yang mencari pemasok.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h2 className="font-display text-xl font-bold text-ink">Cari Pemasok</h2>
                <p className="mt-1 text-sm text-ink-soft">
                    Bandingkan harga dan stok dari beberapa pemasok sebelum memutuskan mau ambil dari
                    siapa.
                </p>
            </div>

            {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            {/* Filter */}
            <div className="grid gap-3 rounded-xl border border-ink/5 bg-white p-4 sm:grid-cols-[1fr_auto_auto]">
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
                    {categories.map((c) => (
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
                    {cities.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                </div>
            ) : groups.length === 0 ? (
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
                    {groups.map((g) => {
                        const selisih = g.priciest - g.cheapest;
                        const hematPersen =
                            g.priciest > 0 ? Math.round((selisih / g.priciest) * 100) : 0;

                        return (
                            <div
                                key={`${g.name}-${g.unit}`}
                                className="overflow-hidden rounded-xl border border-ink/5 bg-white"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                                    <div>
                                        <h3 className="font-display text-base font-bold text-ink">
                                            {g.name}
                                        </h3>
                                        <p className="mt-0.5 text-xs text-ink-soft">
                                            {g.category} · {g.offers.length} pemasok
                                        </p>
                                    </div>

                                    {g.offers.length > 1 && selisih > 0 && (
                                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                                            Hemat sampai {formatRupiah(selisih)}/{g.unit} ({hematPersen}%)
                                        </span>
                                    )}
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {g.offers.map((offer, idx) => {
                                        const termurah = idx === 0 && g.offers.length > 1;

                                        return (
                                            <div
                                                key={offer.product.id}
                                                className={`flex flex-wrap items-center justify-between gap-4 px-5 py-4 ${termurah ? "bg-green-50/40" : ""
                                                    }`}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-medium text-ink">
                                                            {offer.product.supplier?.groupName ??
                                                                "Pemasok"}
                                                        </span>

                                                        {termurah && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-green px-2 py-0.5 text-[11px] font-medium text-white">
                                                                <Award size={11} /> Termurah
                                                            </span>
                                                        )}

                                                        {offer.hasOpenOrder && (
                                                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-brand-blue">
                                                                Ada order kolektif
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPin size={12} />
                                                            {offer.product.supplier?.city ?? "-"}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <Package size={12} />
                                                            stok {formatNumber(offer.product.stock)}{" "}
                                                            {g.unit}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div
                                                        className={`font-display text-lg font-bold ${termurah
                                                                ? "text-brand-green"
                                                                : "text-ink"
                                                            }`}
                                                    >
                                                        {formatRupiah(offer.price)}
                                                    </div>
                                                    <div className="text-xs text-ink-soft">
                                                        per {g.unit}
                                                    </div>
                                                </div>

                                                {offer.hasOpenOrder ? (
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