"use client";

import { useEffect, useState } from "react";
import { Users, Clock, Package, TrendingDown } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { TombolBayarMidtrans } from "@/components/dashboard/TombolBayarDaring";
import { batalkanPembayaran } from "@/lib/payment";
import type { BulkPricing, ProcurementOrder, ProcurementOrderItem } from "@/types/dashboard";

const statusLabel: Record<string, string> = {
    pending: "Menunggu Pembayaran",
    paid: "Lunas",
};
const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    paid: "bg-green-100 text-green-700",
};

const rupiah = (n: number) => `Rp${Math.round(n).toLocaleString("id-ID")}`;

export default function ProcurementPage() {
    const [tab, setTab] = useState<"open" | "mine">("open");
    const [openOrders, setOpenOrders] = useState<ProcurementOrder[]>([]);
    const [myItems, setMyItems] = useState<ProcurementOrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const [quantityInput, setQuantityInput] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

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
            // Tanpa catch, kegagalan backend bikin halaman diam tanpa pesan
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, []);

    const joinedOrderIds = new Set(myItems.map((i) => i.orderId));

    async function handleJoin(orderId: string) {
        setError(null);
        const qty = Number(quantityInput[orderId]);
        if (!qty || qty <= 0) {
            setError("Masukkan jumlah yang valid dulu");
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


    return (
        <div className="flex flex-col gap-5">
            {/* Tabs */}
            <div className="inline-flex w-fit rounded-xl bg-white p-1 shadow-sm">
                <button
                    onClick={() => setTab("open")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tab === "open" ? "bg-brand-blue text-white" : "text-ink-soft"
                        }`}
                >
                    Order Terbuka
                </button>
                <button
                    onClick={() => setTab("mine")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tab === "mine" ? "bg-brand-blue text-white" : "text-ink-soft"
                        }`}
                >
                    Pesanan Saya
                </button>
            </div>

            {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            {loading ? (
                <p className="text-sm text-ink-soft">Memuat data...</p>
            ) : tab === "open" ? (
                openOrders.length === 0 ? (
                    <p className="rounded-xl border border-ink/5 bg-white p-6 text-sm text-ink-soft">
                        Belum ada sesi belanja kolektif yang terbuka saat ini.
                    </p>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {openOrders.map((order) => {
                            const alreadyJoined = joinedOrderIds.has(order.id);
                            const pricing = order.pricing;
                            const terkumpul = Number(order.totalQuantity);

                            return (
                                <div
                                    key={order.id}
                                    className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-brand-green">
                                                <Package size={13} />
                                                {order.product.category}
                                            </div>

                                            <h3 className="mt-2 font-display text-lg font-bold text-ink">
                                                {order.product.name}
                                            </h3>

                                            <p className="text-sm text-ink-soft">
                                                {order.product.supplier.groupName} •{" "}
                                                {order.product.supplier.city}
                                            </p>
                                        </div>

                                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                            Aktif
                                        </span>
                                    </div>

                                    <div className="mt-5 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <div className="text-xs text-ink-soft">Harga</div>

                                            {pricing?.isBulkActive ? (
                                                <>
                                                    <div className="mt-1 font-semibold text-brand-green">
                                                        {rupiah(pricing.unitPrice)}
                                                    </div>
                                                    <div className="text-xs text-ink-soft line-through">
                                                        {rupiah(pricing.normalPrice)}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="mt-1 font-semibold text-ink">
                                                        {rupiah(Number(order.product.price))}
                                                    </div>
                                                    <div className="text-xs text-ink-soft">
                                                        per {order.product.unit}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <div className="text-xs text-ink-soft">
                                                Total Terkumpul
                                            </div>
                                            <div className="mt-1 font-semibold text-brand-green">
                                                {terkumpul} {order.product.unit}
                                            </div>
                                            <div className="text-xs text-ink-soft">
                                                dari seluruh UMKM
                                            </div>
                                        </div>
                                    </div>

                                    <BulkProgress
                                        pricing={pricing}
                                        terkumpul={terkumpul}
                                        unit={order.product.unit}
                                    />

                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="flex items-center gap-1 text-xs text-ink-soft">
                                            <Users size={13} />
                                            {order.items.length} UMKM Bergabung
                                        </span>

                                        <span className="flex items-center gap-1 text-xs text-ink-soft">
                                            <Clock size={12} />
                                            {new Date(order.deadline).toLocaleDateString("id-ID")}
                                        </span>
                                    </div>

                                    {alreadyJoined ? (
                                        <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-center text-xs font-semibold text-green-700">
                                            Kamu sudah gabung ✓
                                        </div>
                                    ) : (
                                        <div className="mt-3 flex gap-2">
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
                                                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand-blue"
                                            />
                                            <Button
                                                onClick={() => handleJoin(order.id)}
                                                loading={joiningId === order.id}
                                                className="shrink-0 px-4 py-2 text-xs"
                                            >
                                                Gabung
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
            ) : myItems.length === 0 ? (
                <p className="rounded-xl border border-ink/5 bg-white p-6 text-sm text-ink-soft">
                    Kamu belum gabung ke pesanan kolektif manapun.
                </p>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {myItems.map((item) => {
                        // Backend sudah hitung subtotal pakai harga yang berlaku (grosir/normal)
                        const suggestedAmount =
                            item.subtotal ??
                            Number(item.quantity) * Number(item.order.product.price);

                        const pricing = item.pricing;

                        const pendingTx = item.transactions?.find((t) => t.status === "pending");
                        const successTx = item.transactions?.find((t) => t.status === "success");

                        return (
                            <div
                                key={item.id}
                                className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-xs font-medium text-brand-green">
                                            {item.order.product.category}
                                        </div>

                                        <h3 className="mt-1 text-lg font-bold text-ink">
                                            {item.order.product.name}
                                        </h3>

                                        <p className="text-sm text-ink-soft">
                                            {item.order.product.supplier.groupName}
                                        </p>
                                    </div>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[item.status]}`}
                                    >
                                        {statusLabel[item.status]}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <div className="text-xs text-ink-soft">Jumlah Pesanan</div>
                                        <div className="mt-1 font-bold text-brand-green">
                                            {item.quantity} {item.order.product.unit}
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <div className="text-xs text-ink-soft">Total Harga</div>
                                        <div className="mt-1 font-bold text-ink">
                                            {rupiah(suggestedAmount)}
                                        </div>
                                        {pricing?.isBulkActive && (
                                            <div className="text-xs text-brand-green">
                                                harga grosir
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {pricing?.isBulkActive && (
                                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                                        <TrendingDown size={14} className="shrink-0" />
                                        Hemat {rupiah(pricing.savingPerUnit)} per{" "}
                                        {item.order.product.unit} — total{" "}
                                        {rupiah(pricing.savingPerUnit * Number(item.quantity))}
                                    </div>
                                )}

                                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                                    <div className="text-xs text-ink-soft">Supplier</div>
                                    <div className="mt-1 font-medium text-ink">
                                        {item.order.product.supplier.groupName}
                                    </div>
                                    <div className="text-xs text-ink-soft">
                                        {item.order.product.supplier.city}
                                    </div>
                                </div>

                                {item.status === "paid" || successTx ? (
                                    <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-center text-sm font-semibold text-green-700">
                                        ✓ Pembayaran Lunas
                                    </div>
                                ) : pendingTx ? (
                                    <div className="mt-4 space-y-2">
                                        <div className="rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-700">
                                            Menunggu Verifikasi Pembayaran
                                        </div>

                                        <button
                                            onClick={async () => {
                                                if (
                                                    !window.confirm(
                                                        "Batalkan pembayaran ini supaya bisa pilih cara lain?"
                                                    )
                                                )
                                                    return;
                                                try {
                                                    await batalkanPembayaran(pendingTx.id);
                                                    loadData();
                                                } catch (err) {
                                                    setError(getApiErrorMessage(err));
                                                }
                                            }}
                                            className="w-full rounded-lg border border-ink/10 px-3 py-2 text-xs font-medium text-ink-soft transition hover:bg-paper-soft hover:text-ink"
                                        >
                                            Batalkan dan pilih cara bayar lain
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-4">
                                        <TombolBayarMidtrans
                                            itemId={item.id}
                                            jumlah={suggestedAmount}
                                            onLunas={loadData}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/**
 * Batang kemajuan menuju harga grosir.
 * Inti dari Collective Procurement: makin banyak yang gabung, makin murah.
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
            <div className="mt-4 rounded-xl bg-green-50 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                    <TrendingDown size={15} />
                    Harga grosir aktif
                </div>
                <p className="mt-1 text-xs text-green-700">
                    Kuota {pricing.bulkMinQty} {unit} tercapai. Semua UMKM yang bergabung hemat{" "}
                    {rupiah(pricing.savingPerUnit)} per {unit}.
                </p>
            </div>
        );
    }

    const persen = Math.min((terkumpul / pricing.bulkMinQty) * 100, 100);

    return (
        <div className="mt-4 rounded-xl bg-blue-50 p-3">
            <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-brand-blue">Menuju harga grosir</span>
                <span className="text-ink-soft">
                    {terkumpul} / {pricing.bulkMinQty} {unit}
                </span>
            </div>

            <div className="mt-2 h-2 rounded-full bg-white">
                <div
                    className="h-2 rounded-full bg-brand-blue transition-all"
                    style={{ width: `${Math.max(persen, 3)}%` }}
                />
            </div>

            <p className="mt-2 text-xs text-ink-soft">
                Kurang{" "}
                <span className="font-semibold text-brand-blue">
                    {pricing.remainingToBulk} {unit}
                </span>{" "}
                lagi supaya harga turun jadi {rupiah(pricing.bulkPrice)}/{unit}.
            </p>
        </div>
    );
}

