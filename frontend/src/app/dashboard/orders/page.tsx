"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
    Plus,
    X,
    ChevronDown,
    ClipboardList,
    Users,
    CalendarClock,
    Truck,
    Lock,
    TrendingDown,
} from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DialogKonfirmasi } from "@/components/dashboard/DialogKonfirmasi";
import { useAuthStore } from "@/store/authStore";
import { temaPeran } from "@/components/dashboard/roleTheme";
import { getApiErrorMessage } from "@/lib/api";
import {
    closeOrder,
    createOrder,
    deliverOrder,
    fetchMyOrders,
    fetchMyProducts,
    updateTransactionStatus,
} from "@/lib/supplier";
import {
    formatDate,
    formatNumber,
    formatRupiah,
    relativeDeadline,
    toDateInput,
} from "@/lib/format";
import type { OrderStatus, SupplierOrder, SupplierProduct } from "@/types/supplier";

const FILTERS: { value: OrderStatus | "all"; label: string }[] = [
    { value: "all", label: "Semua Pesanan" },
    { value: "open", label: "Terbuka" },
    { value: "closed", label: "Ditutup" },
    { value: "delivered", label: "Terkirim" },
];

export default function OrdersPage() {
    const user = useAuthStore((s) => s.user);
    const tema = temaPeran(user?.role ?? "supplier");
    const warnaPeran = {
        "--warna-peran": tema.aksen,
        "--warna-peran-latar": tema.latar,
        "--warna-gelap": tema.sidebar,
    } as CSSProperties;

    const [orders, setOrders] = useState<SupplierOrder[]>([]);
    const [products, setProducts] = useState<SupplierProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<OrderStatus | "all">("all");
    const [expanded, setExpanded] = useState<string | null>(null);
    const [actingId, setActingId] = useState<string | null>(null);
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [konfirmasi, setKonfirmasi] = useState<{
        id: string;
        aksi: "close" | "deliver";
    } | null>(null);

    const load = useCallback(async () => {
        try {
            const [o, p] = await Promise.all([fetchMyOrders(), fetchMyProducts()]);
            setOrders(o);
            setProducts(p);
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

    const visible = useMemo(
        () => (filter === "all" ? orders : orders.filter((o) => o.status === filter)),
        [orders, filter]
    );

    async function verifyPayment(txId: string, status: "success" | "failed") {
        setVerifyingId(txId);
        try {
            await updateTransactionStatus(txId, status);
            await load();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setVerifyingId(null);
        }
    }

    async function runAction(id: string, action: "close" | "deliver") {
        setActingId(id);
        try {
            if (action === "close") await closeOrder(id);
            else await deliverOrder(id);
            await load();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setActingId(null);
            setKonfirmasi(null);
        }
    }

    if (user && user.role !== "supplier") {
        return <p className="text-sm font-medium text-slate-500 p-6">Halaman ini khusus untuk akun supplier / pemasok.</p>;
    }

    return (
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
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                            Manajemen Logistik & Sesi
                        </div>
                        <h2 className="mt-4 font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
                            Pesanan Kolektif
                        </h2>
                        <p className="mt-2 text-sm font-medium text-white/70 max-w-xl leading-relaxed">
                            Buka sesi pemesanan, kumpulkan permintaan dari berbagai UMKM sekaligus, lalu kirimkan dalam satu rute pengiriman yang efisien.
                        </p>
                    </div>

                    <button
                        onClick={() => setFormOpen(true)}
                        disabled={products.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-md transition-all hover:bg-white/90 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
                    >
                        <Plus size={18} strokeWidth={2.5} /> Buka Pesanan Baru
                    </button>
                </div>
            </div>

            {products.length === 0 && !loading && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-medium text-amber-800 leading-relaxed shadow-sm">
                    ⚠️ Tambahkan produk terlebih dahulu di{" "}
                    <Link href="/dashboard/products" className="font-bold underline hover:text-amber-950">
                        Katalog Produk
                    </Link>{" "}
                    sebelum dapat membuka sesi pesanan kolektif.
                </div>
            )}

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700 shadow-sm">
                    {error}
                </div>
            )}

            {/* Filter Tab ala iOS */}
            <div className="flex gap-2 overflow-x-auto rounded-2xl bg-slate-200/70 p-1.5 shadow-inner">
                {FILTERS.map((f) => {
                    const count =
                        f.value === "all"
                            ? orders.length
                            : orders.filter((o) => o.status === f.value).length;
                    const active = filter === f.value;

                    return (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`shrink-0 rounded-xl px-5 py-2 text-xs font-bold transition-all ${active
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            {f.label} <span className="ml-1 opacity-60">({count})</span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-32 animate-pulse rounded-3xl bg-slate-100" />
                    ))}
                </div>
            ) : visible.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
                        <ClipboardList size={28} />
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-800">
                        {filter === "all" ? "Belum ada pesanan kolektif aktif" : "Tidak ada pesanan dengan filter ini"}
                    </h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 leading-relaxed">
                        {filter === "all"
                            ? "Buka sesi pemesanan baru untuk produkmu agar UMKM dapat mulai bergabung hingga batas waktu terpenuhi."
                            : "Coba ubah pilihan filter di atas untuk melihat status pesanan lainnya."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {visible.map((o) => {
                        const isOpen = expanded === o.id;
                        const busy = actingId === o.id;

                        return (
                            <div
                                key={o.id}
                                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all hover:border-slate-300"
                            >
                                <div className="p-6 sm:p-7">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2.5">
                                                <h3 className="font-display text-lg font-extrabold text-slate-900">
                                                    {o.product.name}
                                                </h3>
                                                <StatusBadge status={o.status} />
                                                {o.pricing?.isBulkActive && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                                                        <TrendingDown size={12} /> Harga Grosir Aktif
                                                    </span>
                                                )}
                                                {o.isExpired && (
                                                    <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-red-700 border border-red-100">
                                                        Lewat Deadline
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-semibold text-slate-500">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <CalendarClock size={14} className="text-slate-400" />
                                                    {formatDate(o.deadline)} · <strong className="text-slate-700">{relativeDeadline(o.deadline)}</strong>
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Users size={14} className="text-slate-400" />
                                                    <strong className="text-slate-700">{o.participantCount} UMKM</strong> bergabung
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <div className="font-display text-2xl font-extrabold text-emerald-600">
                                                {formatNumber(o.totalQuantity)} <span className="text-sm font-semibold text-slate-400">{o.product.unit}</span>
                                            </div>
                                            <div className="text-sm font-bold text-slate-800 mt-0.5">
                                                {formatRupiah(o.estimatedValue)}
                                            </div>
                                            <div className="text-xs font-medium text-slate-400 mt-0.5">
                                                {formatRupiah(o.product.price)}/{o.product.unit}
                                                {o.pricing?.isBulkActive && (
                                                    <span className="ml-1.5 line-through text-slate-300">
                                                        {formatRupiah(o.pricing.normalPrice)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {o.pricing?.bulkMinQty != null &&
                                        !o.pricing.isBulkActive &&
                                        o.status === "open" && (
                                            <div className="mt-4 rounded-2xl border border-[var(--warna-peran)]/20 bg-[var(--warna-peran-latar)] px-4 py-3 text-xs font-semibold text-[var(--warna-peran)] leading-relaxed">
                                                💡 Kurang <strong>{formatNumber(o.pricing.remainingToBulk)} {o.product.unit}</strong> lagi agar harga grosir spesial <strong>{formatRupiah(o.pricing.bulkPrice ?? 0)}</strong> aktif otomatis untuk seluruh UMKM peserta.
                                            </div>
                                        )}

                                    <div className="mt-6 flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-100">
                                        {o.status === "open" && (
                                            <button
                                                onClick={() => setKonfirmasi({ id: o.id, aksi: "close" })}
                                                disabled={busy}
                                                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60"
                                            >
                                                <Lock size={15} />
                                                {busy ? "Memproses..." : "Tutup Pesanan"}
                                            </button>
                                        )}

                                        {o.status === "closed" && (
                                            <button
                                                onClick={() => setKonfirmasi({ id: o.id, aksi: "deliver" })}
                                                disabled={busy}
                                                className="inline-flex items-center gap-2 rounded-xl bg-[var(--warna-peran)] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:brightness-90 disabled:opacity-60"
                                            >
                                                <Truck size={15} />
                                                {busy ? "Memproses..." : "Tandai Terkirim"}
                                            </button>
                                        )}

                                        {o.participantCount > 0 && (
                                            <button
                                                onClick={() => setExpanded(isOpen ? null : o.id)}
                                                aria-expanded={isOpen}
                                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 ml-auto"
                                            >
                                                Rincian UMKM Peserta
                                                <ChevronDown
                                                    size={16}
                                                    className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                                                        }`}
                                                />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Accordion Rincian UMKM */}
                                {isOpen && (
                                    <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-5">
                                        <div className="space-y-3">
                                            {o.items.map((it) => {
                                                const pendingTx = it.transactions.find(
                                                    (t) => t.status === "pending"
                                                );

                                                return (
                                                    <div
                                                        key={it.id}
                                                        className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
                                                    >
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="min-w-0">
                                                                <div className="truncate font-bold text-slate-900 text-sm">
                                                                    {it.umkm.businessName}
                                                                </div>
                                                                <div className="truncate text-xs font-medium text-slate-500 mt-0.5">
                                                                    {it.umkm.businessType} · {it.umkm.city}
                                                                </div>
                                                            </div>

                                                            <div className="shrink-0 text-right">
                                                                <div className="font-bold text-slate-900 text-sm">
                                                                    {formatNumber(it.quantity)} {o.product.unit}
                                                                </div>
                                                                <div className="text-xs font-medium text-slate-500 mt-0.5">
                                                                    {formatRupiah(it.subtotal)} ·{" "}
                                                                    <span
                                                                        className={`font-bold ${it.status === "paid"
                                                                                ? "text-emerald-600"
                                                                                : "text-amber-600"
                                                                            }`}
                                                                    >
                                                                        {it.status === "paid" ? "Sudah Bayar" : "Belum Bayar"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {pendingTx && (
                                                            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs font-semibold text-amber-900">
                                                                <span>
                                                                    Pembayaran transfer senilai{" "}
                                                                    <strong className="text-amber-950">{formatRupiah(pendingTx.amount)}</strong> menunggu verifikasi Anda.
                                                                </span>

                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() =>
                                                                            verifyPayment(pendingTx.id, "success")
                                                                        }
                                                                        disabled={verifyingId === pendingTx.id}
                                                                        className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                                                                    >
                                                                        Terima
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            verifyPayment(pendingTx.id, "failed")
                                                                        }
                                                                        disabled={verifyingId === pendingTx.id}
                                                                        className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                                                                    >
                                                                        Tolak
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <DialogKonfirmasi
                terbuka={konfirmasi !== null}
                sibuk={actingId !== null}
                judul={
                    konfirmasi?.aksi === "close"
                        ? "Tutup pesanan kolektif?"
                        : "Tandai pesanan sudah dikirim?"
                }
                pesan={
                    konfirmasi?.aksi === "close"
                        ? "UMKM tidak dapat lagi bergabung setelah sesi pemesanan ini ditutup."
                        : "Pesanan akan dinyatakan selesai dan stok produk terpotong secara otomatis."
                }
                keterangan={
                    konfirmasi?.aksi === "close"
                        ? "Lakukan ini jika jumlah kuota sudah terpenuhi atau batas waktu berakhir."
                        : "Pastikan barang fisik sudah dikirimkan dengan baik kepada seluruh UMKM peserta."
                }
                labelYa={konfirmasi?.aksi === "close" ? "Tutup Pesanan" : "Tandai Terkirim"}
                onBatal={() => setKonfirmasi(null)}
                onYa={() => {
                    if (konfirmasi) runAction(konfirmasi.id, konfirmasi.aksi);
                }}
            />

            {formOpen && (
                <NewOrderModal
                    products={products}
                    onClose={() => setFormOpen(false)}
                    onCreated={async () => {
                        setFormOpen(false);
                        await load();
                    }}
                />
            )}
        </div>
    );
}

function NewOrderModal({
    products,
    onClose,
    onCreated,
}: {
    products: SupplierProduct[];
    onClose: () => void;
    onCreated: () => void;
}) {
    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 7);

    const [productId, setProductId] = useState(products[0]?.id ?? "");
    const [deadline, setDeadline] = useState(toDateInput(defaultDeadline));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selected = products.find((p) => p.id === productId);

    async function handleSubmit() {
        if (!productId) {
            setError("Pilih produk terlebih dahulu.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await createOrder(productId, deadline);
            onCreated();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Buka pesanan kolektif"
                className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="font-display text-lg font-extrabold text-slate-900">
                        Buka Sesi Pesanan Kolektif
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Tutup"
                        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-5 space-y-4">
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                            Produk yang Dipasok
                        </span>
                        <select
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[var(--warna-peran)] focus:bg-white focus:ring-1 focus:ring-[var(--warna-peran)]"
                        >
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} — {formatRupiah(p.price)}/{p.unit}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                            Batas Waktu Bergabung (Deadline)
                        </span>
                        <input
                            type="date"
                            value={deadline}
                            min={toDateInput(new Date())}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[var(--warna-peran)] focus:bg-white focus:ring-1 focus:ring-[var(--warna-peran)]"
                        />
                    </label>

                    {selected && (
                        <p className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs font-medium text-slate-600 leading-relaxed">
                            UMKM dapat bergabung hingga <strong className="text-slate-900">{formatDate(deadline)}</strong>. Total stok gudang saat ini <strong className="text-slate-900">{formatNumber(selected.stock)} {selected.unit}</strong>.
                        </p>
                    )}

                    {error && (
                        <p className="rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600">
                            {error}
                        </p>
                    )}
                </div>

                <div className="mt-6 flex gap-3 pt-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {saving ? "Membuka..." : "Buka Pesanan"}
                    </button>
                </div>
            </div>
        </div>
    );
}