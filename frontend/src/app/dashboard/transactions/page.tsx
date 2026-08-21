"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Receipt, TrendingUp, Wallet, Clock, PiggyBank } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/lib/api";
import {
    fetchAdminTransactions,
    fetchMyTransactions,
    fetchSupplierTransactions,
    verifyTransaction,
} from "@/lib/transactions";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { StatCard } from "@/components/dashboard/StatCard";
import { PaymentBadge } from "@/components/dashboard/PaymentBadge";
import type {
    AdminTransaction,
    SupplierTransaction,
    TxStatus,
    UmkmTransaction,
} from "@/types/transaction";

export default function TransactionsPage() {
    const user = useAuthStore((s) => s.user);

    if (!user) return null;
    if (user.role === "supplier") return <SupplierTransactions />;
    if (user.role === "admin") return <AdminTransactions />;
    return <UmkmTransactions />;
}

// ============================================================
// UMKM — riwayat pembayaran sendiri
// ============================================================

function UmkmTransactions() {
    const [rows, setRows] = useState<UmkmTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setRows(await fetchMyTransactions());
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

    const totalLunas = rows
        .filter((r) => r.status === "success")
        .reduce((s, r) => s + r.amount, 0);
    const totalMenunggu = rows
        .filter((r) => r.status === "pending")
        .reduce((s, r) => s + r.amount, 0);
    const totalHemat = rows
        .filter((r) => r.status === "success")
        .reduce((s, r) => s + r.saving, 0);

    return (
        <div className="flex flex-col gap-5">
            <p className="text-sm text-ink-soft">
                Semua pembayaran belanja kolektif yang pernah kamu lakukan.
            </p>

            {error && <ErrorNote>{error}</ErrorNote>}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={Receipt}
                    label="Total Transaksi"
                    value={loading ? "..." : String(rows.length)}
                    sub={`${rows.filter((r) => r.status === "success").length} lunas`}
                />
                <StatCard
                    icon={Wallet}
                    label="Total Dibayar"
                    value={loading ? "..." : formatRupiah(totalLunas)}
                    sub="Pembayaran terkonfirmasi"
                    color="text-brand-green"
                />
                <StatCard
                    icon={PiggyBank}
                    label="Hemat dari Belanja Kolektif"
                    value={loading ? "..." : formatRupiah(totalHemat)}
                    sub={
                        totalLunas > 0
                            ? `${((totalHemat / (totalLunas + totalHemat)) * 100).toFixed(1)}% dari harga normal`
                            : "Belum ada penghematan"
                    }
                    color="text-brand-blue"
                />
                <StatCard
                    icon={Clock}
                    label="Menunggu Konfirmasi"
                    value={loading ? "..." : formatRupiah(totalMenunggu)}
                    sub="Belum diverifikasi pemasok"
                    color="text-amber-500"
                />
            </div>

            {loading ? (
                <SkeletonTable />
            ) : rows.length === 0 ? (
                <EmptyState
                    title="Belum ada transaksi"
                    body="Gabung ke belanja kolektif dan lakukan pembayaran, riwayatnya akan muncul di sini."
                />
            ) : (
                <TableShell
                    head={["Bahan Baku", "Pemasok", "Jumlah", "Nilai", "Hemat", "Status", "Tanggal"]}
                    mobile={rows.map((r) => (
                        <div key={r.id} className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="truncate font-medium text-ink">
                                        {r.product.name}
                                    </div>
                                    <div className="truncate text-xs text-ink-soft">
                                        {r.supplier.groupName} · {formatNumber(r.quantity)}{" "}
                                        {r.product.unit}
                                    </div>
                                </div>
                                <PaymentBadge status={r.status} />
                            </div>

                            <div className="mt-3 flex items-baseline justify-between text-sm">
                                <span className="font-semibold text-ink">
                                    {formatRupiah(r.amount)}
                                </span>
                                {r.saving > 0 && (
                                    <span className="text-xs font-medium text-brand-green">
                                        hemat {formatRupiah(r.saving)}
                                    </span>
                                )}
                            </div>

                            <div className="mt-1 text-xs text-ink-soft">
                                {formatDate(r.createdAt)}
                            </div>
                        </div>
                    ))}
                >
                    {rows.map((r) => (
                        <tr key={r.id} className="border-t border-slate-100">
                            <td className="px-5 py-3 font-medium text-ink">{r.product.name}</td>
                            <td className="px-5 py-3 text-ink-soft">
                                {r.supplier.groupName}
                                <div className="text-xs">{r.supplier.city}</div>
                            </td>
                            <td className="px-5 py-3 text-ink-soft">
                                {formatNumber(r.quantity)} {r.product.unit}
                            </td>
                            <td className="px-5 py-3 font-medium">
                                {formatRupiah(r.amount)}
                                {r.isBulkActive && (
                                    <div className="text-xs font-normal text-ink-soft line-through">
                                        {formatRupiah(r.normalPrice * r.quantity)}
                                    </div>
                                )}
                            </td>
                            <td className="px-5 py-3">
                                {r.saving > 0 ? (
                                    <span className="font-medium text-brand-green">
                                        {formatRupiah(r.saving)}
                                    </span>
                                ) : (
                                    <span className="text-ink-soft">-</span>
                                )}
                            </td>
                            <td className="px-5 py-3">
                                <PaymentBadge status={r.status} />
                            </td>
                            <td className="px-5 py-3 text-ink-soft">{formatDate(r.createdAt)}</td>
                        </tr>
                    ))}
                </TableShell>
            )}
        </div>
    );
}

// ============================================================
// Supplier — pembayaran masuk + verifikasi
// ============================================================

function SupplierTransactions() {
    const [rows, setRows] = useState<SupplierTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [filter, setFilter] = useState<TxStatus | "all">("all");

    const load = useCallback(async () => {
        try {
            setRows(await fetchSupplierTransactions());
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

    async function verify(id: string, status: "success" | "failed") {
        setBusyId(id);
        try {
            await verifyTransaction(id, status);
            await load();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setBusyId(null);
        }
    }

    const visible = useMemo(
        () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
        [rows, filter]
    );

    const pemasukan = rows
        .filter((r) => r.status === "success")
        .reduce((s, r) => s + r.supplierPayout, 0);
    const menunggu = rows.filter((r) => r.status === "pending");

    return (
        <div className="flex flex-col gap-5">
            <p className="text-sm text-ink-soft">
                Pembayaran dari UMKM untuk pesanan kolektif Anda. Konfirmasi setelah dana diterima.
            </p>

            {error && <ErrorNote>{error}</ErrorNote>}

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    icon={Wallet}
                    label="Dana Diterima"
                    value={loading ? "..." : formatRupiah(pemasukan)}
                    sub="Setelah potongan komisi"
                    color="text-brand-green"
                />
                <StatCard
                    icon={Clock}
                    label="Perlu Dikonfirmasi"
                    value={loading ? "..." : String(menunggu.length)}
                    sub={formatRupiah(menunggu.reduce((s, r) => s + r.amount, 0))}
                    color="text-amber-500"
                />
                <StatCard
                    icon={Receipt}
                    label="Total Transaksi"
                    value={loading ? "..." : String(rows.length)}
                    sub="Sepanjang waktu"
                />
            </div>

            <div className="flex gap-2 overflow-x-auto">
                {(["all", "pending", "success", "failed"] as const).map((f) => {
                    const label =
                        f === "all"
                            ? "Semua"
                            : f === "pending"
                                ? "Menunggu"
                                : f === "success"
                                    ? "Lunas"
                                    : "Ditolak";
                    const count = f === "all" ? rows.length : rows.filter((r) => r.status === f).length;

                    return (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === f
                                    ? "bg-brand-blue text-white"
                                    : "bg-paper-soft text-ink-soft hover:text-ink"
                                }`}
                        >
                            {label} ({count})
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <SkeletonTable />
            ) : visible.length === 0 ? (
                <EmptyState
                    title="Belum ada pembayaran"
                    body="Pembayaran muncul di sini setelah UMKM membayar pesanan kolektif Anda."
                />
            ) : (
                <div className="space-y-3">
                    {visible.map((r) => (
                        <div
                            key={r.id}
                            className="rounded-xl border border-ink/5 bg-white p-5 shadow-sm"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium text-ink">
                                            {r.umkm.businessName}
                                        </span>
                                        <PaymentBadge status={r.status} />
                                    </div>
                                    <div className="mt-1 text-xs text-ink-soft">
                                        {r.product.name} · {formatNumber(r.quantity)}{" "}
                                        {r.product.unit} · {formatDate(r.createdAt)}
                                        {r.channel && ` · ${r.channel}`}
                                    </div>

                                    {r.paymentProofUrl && (
                                        <a
                                            href={r.paymentProofUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-1.5 inline-block text-xs font-medium text-brand-blue hover:underline"
                                        >
                                            Lihat bukti transfer
                                        </a>
                                    )}
                                </div>

                                <div className="text-right">
                                    <div className="font-display text-lg font-bold text-ink">
                                        {formatRupiah(r.amount)}
                                    </div>
                                    <div className="text-xs text-ink-soft">
                                        diterima {formatRupiah(r.supplierPayout)} · komisi{" "}
                                        {formatRupiah(r.platformFee)}
                                    </div>
                                </div>
                            </div>

                            {r.status === "success" && (
                                <div
                                    className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-xs ${r.payoutStatus === "paid"
                                            ? "bg-green-50 text-green-700"
                                            : "bg-paper-soft text-ink-soft"
                                        }`}
                                >
                                    <span>
                                        {r.payoutStatus === "paid"
                                            ? `Dana ${formatRupiah(r.supplierPayout)} sudah diteruskan${r.payoutAt ? ` pada ${formatDate(r.payoutAt)}` : ""
                                            }`
                                            : `Dana ${formatRupiah(r.supplierPayout)} menunggu diteruskan platform`}
                                    </span>

                                    {r.payoutProofUrl && (
                                        <a
                                            href={r.payoutProofUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-medium underline"
                                        >
                                            Lihat bukti transfer
                                        </a>
                                    )}
                                </div>
                            )}

                            {r.status === "pending" && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        onClick={() => verify(r.id, "success")}
                                        disabled={busyId === r.id}
                                        className="rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-green-dark disabled:opacity-60"
                                    >
                                        {busyId === r.id ? "Memproses..." : "Konfirmasi diterima"}
                                    </button>
                                    <button
                                        onClick={() => verify(r.id, "failed")}
                                        disabled={busyId === r.id}
                                        className="rounded-lg border border-ink/10 px-4 py-2 text-sm font-medium text-ink transition hover:bg-paper-soft disabled:opacity-60"
                                    >
                                        Tolak
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================
// Admin — seluruh transaksi platform
// ============================================================

function AdminTransactions() {
    const [rows, setRows] = useState<AdminTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setRows(await fetchAdminTransactions());
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

    const komisi = rows
        .filter((r) => r.status === "success")
        .reduce((s, r) => s + r.platformFee, 0);
    const gmv = rows.filter((r) => r.status === "success").reduce((s, r) => s + r.amount, 0);

    return (
        <div className="flex flex-col gap-5">
            <p className="text-sm text-ink-soft">
                Seluruh transaksi yang mengalir lewat platform beserta komisi yang diperoleh.
            </p>

            {error && <ErrorNote>{error}</ErrorNote>}

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    icon={TrendingUp}
                    label="Nilai Transaksi (GMV)"
                    value={loading ? "..." : formatRupiah(gmv)}
                    sub="Transaksi terkonfirmasi"
                />
                <StatCard
                    icon={Wallet}
                    label="Pendapatan Komisi"
                    value={loading ? "..." : formatRupiah(komisi)}
                    sub="Pemasukan PanganKreatif"
                    color="text-brand-green"
                />
                <StatCard
                    icon={Receipt}
                    label="Jumlah Transaksi"
                    value={loading ? "..." : String(rows.length)}
                    sub={`${rows.filter((r) => r.status === "pending").length} menunggu`}
                    color="text-amber-500"
                />
            </div>

            {loading ? (
                <SkeletonTable />
            ) : rows.length === 0 ? (
                <EmptyState
                    title="Belum ada transaksi"
                    body="Transaksi tercatat otomatis begitu UMKM membayar pesanan kolektif."
                />
            ) : (
                <TableShell
                    head={["UMKM", "Pemasok", "Bahan Baku", "Nilai", "Komisi", "Status", "Tanggal"]}
                    mobile={rows.map((r) => (
                        <div key={r.id} className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="truncate font-medium text-ink">
                                        {r.umkm.businessName}
                                    </div>
                                    <div className="truncate text-xs text-ink-soft">
                                        {r.product.name} dari {r.supplier.groupName}
                                    </div>
                                </div>
                                <PaymentBadge status={r.status} />
                            </div>

                            <div className="mt-3 flex items-baseline justify-between text-sm">
                                <span className="text-ink">{formatRupiah(r.amount)}</span>
                                <span className="text-xs font-medium text-brand-green">
                                    komisi {formatRupiah(r.platformFee)}
                                </span>
                            </div>

                            <div className="mt-1 text-xs text-ink-soft">
                                {formatNumber(r.quantity)} {r.product.unit} ·{" "}
                                {formatDate(r.createdAt)}
                            </div>
                        </div>
                    ))}
                >
                    {rows.map((r) => (
                        <tr key={r.id} className="border-t border-slate-100">
                            <td className="px-5 py-3 font-medium text-ink">
                                {r.umkm.businessName}
                                <div className="text-xs font-normal text-ink-soft">
                                    {r.umkm.city}
                                </div>
                            </td>
                            <td className="px-5 py-3 text-ink-soft">{r.supplier.groupName}</td>
                            <td className="px-5 py-3 text-ink-soft">
                                {r.product.name}
                                <div className="text-xs">
                                    {formatNumber(r.quantity)} {r.product.unit}
                                </div>
                            </td>
                            <td className="px-5 py-3">{formatRupiah(r.amount)}</td>
                            <td className="px-5 py-3 font-medium text-brand-green">
                                {formatRupiah(r.platformFee)}
                                <div className="text-xs font-normal text-ink-soft">
                                    {(r.commissionRate * 100).toFixed(1)}%
                                </div>
                            </td>
                            <td className="px-5 py-3">
                                <PaymentBadge status={r.status} />
                            </td>
                            <td className="px-5 py-3 text-ink-soft">{formatDate(r.createdAt)}</td>
                        </tr>
                    ))}
                </TableShell>
            )}
        </div>
    );
}

// ============================================================
// Potongan tampilan bersama
// ============================================================

/**
 * Tabel untuk layar lebar, kartu bertumpuk untuk layar kecil.
 *
 * Sebagian besar pengguna membuka lewat HP, dan tabel yang harus
 * digeser ke samping sulit dibaca di sana.
 */
function TableShell({
    head,
    children,
    mobile,
}: {
    head: string[];
    children: React.ReactNode;
    mobile?: React.ReactNode;
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-ink/5 bg-white shadow-sm">
            <table className="hidden w-full text-left text-sm md:table">
                <thead className="bg-paper-soft text-xs font-semibold text-ink-soft">
                    <tr>
                        {head.map((h) => (
                            <th key={h} className="px-5 py-3">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>{children}</tbody>
            </table>

            <div className="divide-y divide-slate-100 md:hidden">{mobile}</div>
        </div>
    );
}

function EmptyState({ title, body }: { title: string; body: string }) {
    return (
        <div className="rounded-xl border border-dashed border-ink/15 bg-white p-10 text-center">
            <Receipt size={26} className="mx-auto text-ink-soft" />
            <h3 className="mt-3 font-display text-base font-bold text-ink">{title}</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">{body}</p>
        </div>
    );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
    return (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{children}</p>
    );
}

function SkeletonTable() {
    return (
        <div className="space-y-3">
            {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
        </div>
    );
}