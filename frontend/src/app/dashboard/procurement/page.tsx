"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Clock, Package, TrendingDown, ShoppingBag, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Filter, XCircle } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { TombolBayarMidtrans } from "@/components/dashboard/TombolBayarDaring";
import { batalkanPembayaran } from "@/lib/payment";
import { DialogKonfirmasi } from "@/components/dashboard/DialogKonfirmasi";
import type { BulkPricing, ProcurementOrder, ProcurementOrderItem } from "@/types/dashboard";

const statusLabel: Record<string, string> = {
    pending: "Menunggu Pembayaran",
    paid: "Lunas",
};

const rupiah = (n: number) => `Rp${Math.round(n).toLocaleString("id-ID")}`;
const ITEMS_PER_PAGE = 6;

export default function ProcurementPage() {
    const [tab, setTab] = useState<"open" | "mine">("open");
    const [openOrders, setOpenOrders] = useState<ProcurementOrder[]>([]);
    const [myItems, setMyItems] = useState<ProcurementOrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const [quantityInput, setQuantityInput] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [membatalkan, setMembatalkan] = useState<string | null>(null);
    const [galatBatal, setGalatBatal] = useState<Record<string, string>>({});

    // State untuk konfirmasi pembatalan pembayaran atau pembatalan keikutsertaan
    const [konfirmasiBatal, setKonfirmasiBatal] = useState<{
        jenis: "transaksi" | "keikutsertaan";
        txId?: string;
        itemId: string;
    } | null>(null);

    // Filter kategori untuk Order Terbuka
    const [selectedCategory, setSelectedCategory] = useState<string>("semua");

    // Sub-filter untuk Pesanan Saya
    const [subFilter, setSubFilter] = useState<"semua" | "belum_lunas" | "lunas">("semua");
    const [currentPage, setCurrentPage] = useState(1);

    async function loadData() {
        try {
            const [ordersRes, itemsRes] = await Promise.all([
                api.get<ProcurementOrder[]>("/procurement/orders", { params: { status: "open" } }),
                api.get<ProcurementOrderItem[]>("/procurement/items/mine"),
            ]);
            setOpenOrders(ordersRes.data);
            setMyItems(itemsRes.data);
            setError(null);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const joinedOrderIds = new Set(myItems.map((i) => i.orderId));

    const availableCategories = useMemo(() => {
        const cats = openOrders.map((o) => o.product.category).filter(Boolean);
        return Array.from(new Set(cats));
    }, [openOrders]);

    const filteredOpenOrders = useMemo(() => {
        let list = openOrders;
        if (selectedCategory !== "semua") {
            list = list.filter((o) => o.product.category === selectedCategory);
        }

        const nilaiUrut = (o: ProcurementOrder) => (joinedOrderIds.has(o.id) ? 1 : 0);

        return [...list].sort((a, b) => {
            const beda = nilaiUrut(a) - nilaiUrut(b);
            if (beda !== 0) return beda;

            const sisaA = a.pricing?.remainingToBulk ?? Number.POSITIVE_INFINITY;
            const sisaB = b.pricing?.remainingToBulk ?? Number.POSITIVE_INFINITY;
            if (sisaA !== sisaB) return sisaA - sisaB;

            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
    }, [openOrders, selectedCategory, joinedOrderIds]);

    const { belumLunas, sudahLunas } = useMemo(() => {
        const belum: ProcurementOrderItem[] = [];
        const sudah: ProcurementOrderItem[] = [];

        myItems.forEach((item) => {
            const lunas = item.status === "paid" || item.transactions?.some((t) => t.status === "success");
            if (lunas) {
                sudah.push(item);
            } else {
                belum.push(item);
            }
        });

        const urutDeadline = (a: ProcurementOrderItem, b: ProcurementOrderItem) =>
            new Date(a.order.deadline).getTime() - new Date(b.order.deadline).getTime();

        return {
            belumLunas: belum.sort(urutDeadline),
            sudahLunas: sudah.sort(urutDeadline),
        };
    }, [myItems]);

    const filteredMyItems = useMemo(() => {
        if (subFilter === "belum_lunas") return belumLunas;
        if (subFilter === "lunas") return sudahLunas;
        return [...belumLunas, ...sudahLunas];
    }, [subFilter, belumLunas, sudahLunas]);

    const totalPagesOpen = Math.ceil(filteredOpenOrders.length / ITEMS_PER_PAGE);
    const paginatedOpenOrders = filteredOpenOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const totalPagesMine = Math.ceil(filteredMyItems.length / ITEMS_PER_PAGE);
    const paginatedMyItems = filteredMyItems.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    async function handleJoin(orderId: string) {
        setError(null);
        const qty = Number(quantityInput[orderId]);
        if (!qty || qty <= 0) {
            setError("Masukkan jumlah pembelian yang valid terlebih dahulu.");
            return;
        }
        setJoiningId(orderId);
        try {
            await api.post(`/procurement/orders/${orderId}/join`, { quantity: qty });
            loadData();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setJoiningId(null);
        }
    }

    // Fungsi untuk membatalkan keikutsertaan item belanja kolektif
    async function handleLeaveOrder(itemId: string) {
        setMembatalkan(itemId);
        try {
            await api.delete(`/procurement/items/${itemId}`);
            loadData();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setMembatalkan(null);
            setKonfirmasiBatal(null);
        }
    }

    return (
        <div className="flex flex-col gap-6 md:gap-8 pb-10">
            {/* Header Halaman */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 mb-2 border border-blue-100">
                    Belanja Bersama & Efisiensi Biaya
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Pengadaan Kolektif (Procurement)
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
                    Bergabunglah dengan pesanan kolektif dari berbagai pemasok untuk mendapatkan harga grosir terbaik secara otomatis saat kuota terpenuhi.
                </p>
            </div>

            {/* Tab Navigasi Utama & Filter Kategori */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2 rounded-2xl bg-slate-200/70 p-1.5 shadow-inner max-w-sm w-full sm:w-auto">
                    <button
                        onClick={() => {
                            setTab("open");
                            setCurrentPage(1);
                        }}
                        className={`flex-1 sm:flex-initial rounded-xl px-6 py-2.5 text-xs font-bold transition-all ${tab === "open"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        Order Terbuka ({openOrders.length})
                    </button>
                    <button
                        onClick={() => {
                            setTab("mine");
                            setCurrentPage(1);
                            setSubFilter("semua");
                        }}
                        className={`flex-1 sm:flex-initial rounded-xl px-6 py-2.5 text-xs font-bold transition-all ${tab === "mine"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        Pesanan Saya ({myItems.length})
                    </button>
                </div>

                {/* Sub-Filter Pil Kategori untuk Order Terbuka */}
                {tab === "open" && availableCategories.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                        <span className="text-xs font-bold text-slate-400 mr-1 hidden sm:inline-flex items-center gap-1">
                            <Filter size={12} /> Kategori:
                        </span>
                        <button
                            onClick={() => { setSelectedCategory("semua"); setCurrentPage(1); }}
                            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${selectedCategory === "semua" ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            Semua
                        </button>
                        {availableCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${selectedCategory === cat ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Sub-Filter Pil Status untuk Pesanan Saya */}
                {tab === "mine" && (
                    <div className="flex gap-1.5 rounded-2xl bg-slate-100 p-1 border border-slate-200 w-full sm:w-auto">
                        <button
                            onClick={() => { setSubFilter("semua"); setCurrentPage(1); }}
                            className={`flex-1 sm:flex-initial rounded-xl px-4 py-2 text-xs font-bold transition-all ${subFilter === "semua" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            Semua ({myItems.length})
                        </button>
                        <button
                            onClick={() => { setSubFilter("belum_lunas"); setCurrentPage(1); }}
                            className={`flex-1 sm:flex-initial rounded-xl px-4 py-2 text-xs font-bold transition-all ${subFilter === "belum_lunas" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            Belum Bayar ({belumLunas.length})
                        </button>
                        <button
                            onClick={() => { setSubFilter("lunas"); setCurrentPage(1); }}
                            className={`flex-1 sm:flex-initial rounded-xl px-4 py-2 text-xs font-bold transition-all ${subFilter === "lunas" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            Lunas ({sudahLunas.length})
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700 shadow-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-72 animate-pulse rounded-3xl bg-slate-100" />
                    ))}
                </div>
            ) : tab === "open" ? (
                filteredOpenOrders.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
                            <ShoppingBag size={28} />
                        </div>
                        <h3 className="font-display text-lg font-bold text-slate-800">Tidak ada order dalam kategori ini</h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 leading-relaxed">
                            Coba pilih kategori filter lain di atas untuk melihat penawaran bahan baku yang tersedia.
                        </p>
                    </div>
                ) : (
                    <div>
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {paginatedOpenOrders.map((order) => {
                                const alreadyJoined = joinedOrderIds.has(order.id);
                                const pricing = order.pricing;
                                const terkumpul = Number(order.totalQuantity);

                                // Hitung sisa hari menuju deadline
                                const diffTime = new Date(order.deadline).getTime() - Date.now();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                return (
                                    <div
                                        key={order.id}
                                        className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all hover:border-slate-300 hover:shadow-md"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                                                        <Package size={14} />
                                                        {order.product.category}
                                                    </div>

                                                    <h3 className="font-display text-xl font-extrabold text-slate-900">
                                                        {order.product.name}
                                                    </h3>

                                                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                                        {order.product.supplier.groupName} • {order.product.supplier.city}
                                                    </p>
                                                </div>

                                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100 shrink-0">
                                                    Aktif
                                                </span>
                                            </div>

                                            <div className="mt-5 grid grid-cols-2 gap-3">
                                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Harga Satuan</div>

                                                    {pricing?.isBulkActive ? (
                                                        <>
                                                            <div className="mt-1 font-display text-lg font-extrabold text-emerald-600">
                                                                {rupiah(pricing.unitPrice)}
                                                            </div>
                                                            <div className="text-xs font-semibold text-slate-400 line-through">
                                                                {rupiah(pricing.normalPrice)}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="mt-1 font-display text-lg font-extrabold text-slate-900">
                                                                {rupiah(Number(order.product.price))}
                                                            </div>
                                                            <div className="text-xs font-semibold text-slate-400">
                                                                per {order.product.unit}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                        Total Terkumpul
                                                    </div>
                                                    <div className="mt-1 font-display text-lg font-extrabold text-emerald-600">
                                                        {terkumpul} <span className="text-xs font-semibold text-slate-500">{order.product.unit}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <BulkProgress
                                                pricing={pricing}
                                                terkumpul={terkumpul}
                                                unit={order.product.unit}
                                            />

                                            <div className="mt-5 flex items-center justify-between text-xs font-semibold text-slate-500 pt-4 border-t border-slate-100">
                                                <span className="flex items-center gap-1.5">
                                                    <Users size={14} className="text-slate-400" />
                                                    <strong className="text-slate-700">{order.items.length} UMKM</strong> Bergabung
                                                </span>

                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${diffDays <= 2 ? "bg-red-50 text-red-600 border border-red-100" : "bg-slate-100 text-slate-600"
                                                    }`}>
                                                    <Clock size={12} />
                                                    {diffDays <= 0 ? "Berakhir hari ini" : `Sisa ${diffDays} hari`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-2">
                                            {alreadyJoined ? (
                                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-center text-xs font-bold text-emerald-800 shadow-sm">
                                                    ✓ Kamu sudah bergabung dalam sesi ini
                                                </div>
                                            ) : (
                                                <div className="flex gap-2.5">
                                                    <input
                                                        type="number"
                                                        placeholder={`Jumlah (${order.product.unit})`}
                                                        value={quantityInput[order.id] ?? ""}
                                                        onChange={(e) =>
                                                            setQuantityInput((prev) => ({
                                                                ...prev,
                                                                [order.id]: e.target.value,
                                                            }))
                                                        }
                                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                                    />
                                                    <Button
                                                        onClick={() => handleJoin(order.id)}
                                                        loading={joiningId === order.id}
                                                        className="shrink-0 px-6 rounded-2xl font-bold shadow-md bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        Gabung
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination untuk Order Terbuka */}
                        {totalPagesOpen > 1 && (
                            <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] mt-8">
                                <div className="text-xs font-medium text-slate-500">
                                    Halaman <strong className="text-slate-800">{currentPage}</strong> dari <strong className="text-slate-800">{totalPagesOpen}</strong>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                                    >
                                        <ChevronLeft size={14} /> Sebelumnya
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPagesOpen))}
                                        disabled={currentPage === totalPagesOpen}
                                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                                    >
                                        Berikutnya <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )
            ) : filteredMyItems.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
                        <ShoppingBag size={28} />
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-800">Tidak ada pesanan dalam kategori ini</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 leading-relaxed">
                        Coba pilih pilihan filter kategori di atas untuk melihat status pesanan lainnya.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {paginatedMyItems.map((item) => renderMyItemCard(item))}
                    </div>

                    {/* Pagination Mandiri untuk Pesanan Saya */}
                    {totalPagesMine > 1 && (
                        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] mt-8">
                            <div className="text-xs font-medium text-slate-500">
                                Halaman <strong className="text-slate-800">{currentPage}</strong> dari <strong className="text-slate-800">{totalPagesMine}</strong>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                                >
                                    <ChevronLeft size={14} /> Sebelumnya
                                </button>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPagesMine))}
                                    disabled={currentPage === totalPagesMine}
                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                                >
                                    Berikutnya <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <DialogKonfirmasi
                terbuka={konfirmasiBatal !== null}
                sibuk={membatalkan !== null}
                bahaya
                judul={konfirmasiBatal?.jenis === "keikutsertaan" ? "Batalkan keikutsertaan pesanan?" : "Batalkan transaksi pembayaran?"}
                pesan={
                    konfirmasiBatal?.jenis === "keikutsertaan"
                        ? "Kamu akan keluar dari sesi pengadaan kolektif ini dan jumlah pesananmu akan dihapus."
                        : "Status pembayaran yang tertunda akan dibatalkan sehingga kamu bisa mengulang proses pembayaran baru."
                }
                keterangan="Pastikan kembali tindakan ini sebelum melanjutkan."
                labelYa="Ya, Batalkan"
                onBatal={() => setKonfirmasiBatal(null)}
                onYa={async () => {
                    if (!konfirmasiBatal) return;

                    if (konfirmasiBatal.jenis === "keikutsertaan") {
                        await handleLeaveOrder(konfirmasiBatal.itemId);
                        return;
                    }

                    const { txId, itemId } = konfirmasiBatal;
                    if (!txId) return;

                    setMembatalkan(txId);
                    setGalatBatal((prev) => {
                        const salin = { ...prev };
                        delete salin[itemId];
                        return salin;
                    });

                    try {
                        await batalkanPembayaran(txId);
                        await loadData();
                    } catch (err) {
                        setGalatBatal((prev) => ({
                            ...prev,
                            [itemId]: getApiErrorMessage(err),
                        }));
                    } finally {
                        setMembatalkan(null);
                        setKonfirmasiBatal(null);
                    }
                }}
            />
        </div>
    );

    function renderMyItemCard(item: ProcurementOrderItem) {
        const suggestedAmount =
            item.subtotal ??
            Number(item.quantity) * Number(item.order.product.price);

        const pricing = item.pricing;
        const pendingTx = item.transactions?.find((t) => t.status === "pending");
        const successTx = item.transactions?.find((t) => t.status === "success");
        const isLunas = item.status === "paid" || successTx;

        return (
            <div
                key={item.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all hover:border-slate-300 hover:shadow-md"
            >
                <div>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                                {item.order.product.category}
                            </div>

                            <h3 className="font-display text-xl font-extrabold text-slate-900">
                                {item.order.product.name}
                            </h3>

                            <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                {item.order.product.supplier.groupName}
                            </p>
                        </div>

                        <span
                            className={`rounded-full px-3 py-1 text-[11px] font-bold shrink-0 ${isLunas ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                                }`}
                        >
                            {isLunas ? "Lunas" : "Menunggu Pembayaran"}
                        </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Jumlah Pesanan</div>
                            <div className="mt-1 font-display text-lg font-extrabold text-emerald-600">
                                {item.quantity} <span className="text-xs font-semibold text-slate-500">{item.order.product.unit}</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Tagihan</div>
                            <div className="mt-1 font-display text-lg font-extrabold text-slate-900">
                                {rupiah(suggestedAmount)}
                            </div>
                            {pricing?.isBulkActive && (
                                <div className="text-[11px] font-bold text-emerald-600">
                                    termasuk diskon grosir
                                </div>
                            )}
                        </div>
                    </div>

                    {pricing?.isBulkActive && (
                        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 leading-relaxed">
                            <TrendingDown size={15} className="shrink-0 text-emerald-600" />
                            <span>
                                Hemat {rupiah(pricing.savingPerUnit)} per {item.order.product.unit} — total penghematan <strong className="text-emerald-950">{rupiah(pricing.savingPerUnit * Number(item.quantity))}</strong>.
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                    {isLunas ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-center text-xs font-bold text-emerald-800 shadow-sm">
                            ✓ Pembayaran Telah Lunas
                        </div>
                    ) : pendingTx ? (
                        <div className="space-y-2">
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-2.5 text-center text-xs font-bold text-amber-800">
                                Menunggu Verifikasi Pembayaran
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() =>
                                        setKonfirmasiBatal({
                                            jenis: "transaksi",
                                            txId: pendingTx.id,
                                            itemId: item.id,
                                        })
                                    }
                                    disabled={membatalkan === pendingTx.id}
                                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                                >
                                    Batalkan Bayar
                                </button>
                                <button
                                    onClick={() =>
                                        setKonfirmasiBatal({
                                            jenis: "keikutsertaan",
                                            itemId: item.id,
                                        })
                                    }
                                    disabled={membatalkan === item.id}
                                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-red-600 shadow-sm transition hover:bg-red-100 disabled:opacity-60"
                                >
                                    <XCircle size={14} /> Keluar Sesi
                                </button>
                            </div>

                            {galatBatal[item.id] && (
                                <p className="rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-600">
                                    {galatBatal[item.id]}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <TombolBayarMidtrans
                                itemId={item.id}
                                jumlah={suggestedAmount}
                                onLunas={loadData}
                            />

                            {/* Tombol batalkan keikutsertaan jika belum bayar sama sekali */}
                            <button
                                onClick={() =>
                                    setKonfirmasiBatal({
                                        jenis: "keikutsertaan",
                                        itemId: item.id,
                                    })
                                }
                                disabled={membatalkan === item.id}
                                className="inline-flex items-center justify-center gap-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 shadow-sm transition hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-60"
                            >
                                <XCircle size={14} /> Batalkan Keikutsertaan Sesi Ini
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

/**
 * Batang kemajuan menuju harga grosir.
 */
function BulkProgress({
    pricing,
    terkumpul,
    unit,
}: {
    pricing?: BulkPricing;
    terkumpul: number;
    unit: string;
}) {
    if (!pricing?.bulkPrice || !pricing.bulkMinQty) return null;

    if (pricing.isBulkActive) {
        return (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                    <TrendingDown size={16} className="text-emerald-600" />
                    Harga Grosir Aktif!
                </div>
                <p className="mt-1 text-xs font-medium text-emerald-700 leading-relaxed">
                    Target {pricing.bulkMinQty} {unit} tercapai. Seluruh UMKM peserta mendapatkan potongan harga spesial.
                </p>
            </div>
        );
    }

    const persen = Math.min((terkumpul / pricing.bulkMinQty) * 100, 100);

    return (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-baseline justify-between text-xs font-bold text-blue-900">
                <span>Progress Menuju Grosir</span>
                <span className="text-blue-600 font-extrabold">
                    {terkumpul} / {pricing.bulkMinQty} {unit}
                </span>
            </div>

            <div className="mt-2.5 h-2.5 rounded-full bg-white overflow-hidden p-0.5 shadow-inner">
                <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(persen, 4)}%` }}
                />
            </div>

            <p className="mt-2 text-xs font-medium text-slate-600 leading-relaxed">
                Kurang <strong className="text-blue-900">{pricing.remainingToBulk} {unit}</strong> lagi agar harga turun menjadi <strong className="text-blue-900">{rupiah(pricing.bulkPrice)}</strong>/{unit}.
            </p>
        </div>
    );
}