"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
    { value: "all", label: "Semua" },
    { value: "open", label: "Terbuka" },
    { value: "closed", label: "Ditutup" },
    { value: "delivered", label: "Terkirim" },
];

export default function OrdersPage() {
    const user = useAuthStore((s) => s.user);

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

    // useCallback + tanpa setState sinkron di awal, supaya aman dipanggil dari effect
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
        return <p className="text-sm text-ink-soft">Halaman ini khusus untuk akun supplier.</p>;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="font-display text-xl font-bold text-ink">Pesanan Kolektif</h2>
                    <p className="mt-1 text-sm text-ink-soft">
                        Buka sesi pemesanan, kumpulkan permintaan beberapa UMKM sekaligus, lalu kirim
                        dalam satu pengiriman.
                    </p>
                </div>

                <button
                    onClick={() => setFormOpen(true)}
                    disabled={products.length === 0}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Plus size={16} /> Buka pesanan
                </button>
            </div>

            {products.length === 0 && !loading && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Tambahkan produk di{" "}
                    <Link href="/dashboard/products" className="font-medium underline">
                        katalog
                    </Link>{" "}
                    dulu sebelum membuka pesanan kolektif.
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="flex gap-2 overflow-x-auto">
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
                            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${active
                                    ? "bg-brand-blue text-white"
                                    : "bg-paper-soft text-ink-soft hover:text-ink"
                                }`}
                        >
                            {f.label} ({count})
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                </div>
            ) : visible.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center">
                    <ClipboardList size={28} className="mx-auto text-ink-soft" />
                    <h3 className="mt-3 font-display text-lg font-bold text-ink">
                        {filter === "all" ? "Belum ada pesanan kolektif" : "Tidak ada di filter ini"}
                    </h3>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
                        {filter === "all"
                            ? "Buka sesi pemesanan untuk salah satu produkmu, lalu UMKM bisa bergabung sampai batas waktu yang kamu tentukan."
                            : "Coba pilih filter lain untuk melihat pesanan yang tersedia."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visible.map((o) => {
                        const isOpen = expanded === o.id;
                        const busy = actingId === o.id;

                        return (
                            <div
                                key={o.id}
                                className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-sm"
                            >
                                <div className="p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-display text-base font-bold text-ink">
                                                    {o.product.name}
                                                </h3>
                                                <StatusBadge status={o.status} />
                                                {o.pricing?.isBulkActive && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                        <TrendingDown size={11} /> Harga grosir aktif
                                                    </span>
                                                )}
                                                {o.isExpired && (
                                                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                                                        Lewat deadline
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <CalendarClock size={13} />
                                                    {formatDate(o.deadline)} ·{" "}
                                                    {relativeDeadline(o.deadline)}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Users size={13} />
                                                    {o.participantCount} UMKM bergabung
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="font-display text-xl font-bold text-brand-green">
                                                {formatNumber(o.totalQuantity)} {o.product.unit}
                                            </div>
                                            <div className="text-xs text-ink-soft">
                                                {formatRupiah(o.estimatedValue)}
                                            </div>
                                            <div className="text-xs text-ink-soft">
                                                {formatRupiah(o.product.price)}/{o.product.unit}
                                                {o.pricing?.isBulkActive && (
                                                    <span className="ml-1 line-through">
                                                        {formatRupiah(o.pricing.normalPrice)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {o.pricing?.bulkMinQty != null &&
                                        !o.pricing.isBulkActive &&
                                        o.status === "open" && (
                                            <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-brand-blue">
                                                Kurang {formatNumber(o.pricing.remainingToBulk)}{" "}
                                                {o.product.unit} lagi supaya harga grosir{" "}
                                                {formatRupiah(o.pricing.bulkPrice ?? 0)} aktif untuk
                                                semua peserta.
                                            </div>
                                        )}

                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        {o.status === "open" && (
                                            <button
                                                onClick={() => setKonfirmasi({ id: o.id, aksi: "close" })}
                                                disabled={busy}
                                                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-60"
                                            >
                                                <Lock size={14} />
                                                {busy ? "Memproses..." : "Tutup pesanan"}
                                            </button>
                                        )}

                                        {o.status === "closed" && (
                                            <button
                                                onClick={() => setKonfirmasi({ id: o.id, aksi: "deliver" })}
                                                disabled={busy}
                                                className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-blue-dark disabled:opacity-60"
                                            >
                                                <Truck size={14} />
                                                {busy ? "Memproses..." : "Tandai terkirim"}
                                            </button>
                                        )}

                                        {o.participantCount > 0 && (
                                            <button
                                                onClick={() => setExpanded(isOpen ? null : o.id)}
                                                aria-expanded={isOpen}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-2 text-sm font-medium text-ink transition hover:bg-paper-soft"
                                            >
                                                Rincian UMKM
                                                <ChevronDown
                                                    size={14}
                                                    className={`transition-transform ${isOpen ? "rotate-180" : ""
                                                        }`}
                                                />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {isOpen && (
                                    <div className="border-t border-slate-100 bg-paper-soft/50 px-5 py-4">
                                        <div className="space-y-2">
                                            {o.items.map((it) => {
                                                const pendingTx = it.transactions.find(
                                                    (t) => t.status === "pending"
                                                );

                                                return (
                                                    <div
                                                        key={it.id}
                                                        className="rounded-lg bg-white px-4 py-3 text-sm"
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="truncate font-medium text-ink">
                                                                    {it.umkm.businessName}
                                                                </div>
                                                                <div className="truncate text-xs text-ink-soft">
                                                                    {it.umkm.businessType} ·{" "}
                                                                    {it.umkm.city}
                                                                </div>
                                                            </div>

                                                            <div className="shrink-0 text-right">
                                                                <div className="font-semibold">
                                                                    {formatNumber(it.quantity)}{" "}
                                                                    {o.product.unit}
                                                                </div>
                                                                <div className="text-xs text-ink-soft">
                                                                    {formatRupiah(it.subtotal)} ·{" "}
                                                                    <span
                                                                        className={
                                                                            it.status === "paid"
                                                                                ? "text-green-600"
                                                                                : "text-amber-600"
                                                                        }
                                                                    >
                                                                        {it.status === "paid"
                                                                            ? "sudah bayar"
                                                                            : "belum bayar"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {pendingTx && (
                                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2">
                                                                <span className="text-xs text-amber-800">
                                                                    Pembayaran{" "}
                                                                    {formatRupiah(pendingTx.amount)}{" "}
                                                                    menunggu konfirmasi
                                                                </span>

                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() =>
                                                                            verifyPayment(
                                                                                pendingTx.id,
                                                                                "success"
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            verifyingId ===
                                                                            pendingTx.id
                                                                        }
                                                                        className="rounded-lg bg-brand-green px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-green-dark disabled:opacity-60"
                                                                    >
                                                                        Terima
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            verifyPayment(
                                                                                pendingTx.id,
                                                                                "failed"
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            verifyingId ===
                                                                            pendingTx.id
                                                                        }
                                                                        className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-white disabled:opacity-60"
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
                        ? "UMKM tidak bisa bergabung lagi setelah pesanan ditutup."
                        : "Pesanan akan tercatat selesai dan stok produk berkurang otomatis."
                }
                keterangan={
                    konfirmasi?.aksi === "close"
                        ? "Lakukan ini kalau kuota sudah terkumpul atau batas waktunya lewat."
                        : "Pastikan barang benar-benar sudah dikirim ke seluruh UMKM peserta."
                }
                labelYa={konfirmasi?.aksi === "close" ? "Tutup pesanan" : "Tandai terkirim"}
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
            setError("Pilih produk dulu.");
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
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Buka pesanan kolektif"
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-ink">
                        Buka pesanan kolektif
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Tutup"
                        className="rounded-lg p-1.5 text-ink-soft transition hover:bg-paper-soft"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-5 space-y-4">
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-ink-soft">
                            Produk yang dipasok
                        </span>
                        <select
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            className="w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                        >
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} — {formatRupiah(p.price)}/{p.unit}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-ink-soft">
                            Batas waktu bergabung
                        </span>
                        <input
                            type="date"
                            value={deadline}
                            min={toDateInput(new Date())}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                        />
                    </label>

                    {selected && (
                        <p className="rounded-lg bg-paper-soft px-3 py-2.5 text-xs text-ink-soft">
                            UMKM bisa bergabung sampai {formatDate(deadline)}. Stok tersedia saat ini{" "}
                            {formatNumber(selected.stock)} {selected.unit}.
                        </p>
                    )}

                    {error && (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                    )}
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-ink/10 px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-paper-soft"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 rounded-lg bg-brand-green px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-green-dark disabled:opacity-60"
                    >
                        {saving ? "Membuka..." : "Buka pesanan"}
                    </button>
                </div>
            </div>
        </div>
    );
}