"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Receipt, TrendingUp, Wallet, Clock, PiggyBank, ArrowLeftRight, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/lib/api";
import {
    fetchAdminTransactions,
    fetchMyTransactions,
    fetchSupplierTransactions,
    verifyTransaction,
} from "@/lib/transactions";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { PaymentBadge } from "@/components/dashboard/PaymentBadge";
import { TombolLihatBukti } from "@/components/dashboard/TombolLihatBukti";
import type {
    AdminTransaction,
    SupplierTransaction,
    TxStatus,
    UmkmTransaction,
} from "@/types/transaction";

const ITEMS_PER_PAGE = 5;

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
    const [currentPage, setCurrentPage] = useState(1);

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

    const totalPages = Math.ceil(rows.length / ITEMS_PER_PAGE);
    const paginatedRows = rows.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="flex flex-col gap-6 md:gap-8 pb-12">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 mb-2 border border-blue-100/60">
                    <ArrowLeftRight size={14} /> Riwayat Finansial
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Transaksi Belanja Kolektif
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
                    Semua pembayaran belanja kolektif yang pernah Anda lakukan tercatat transparan di sini.
                </p>
            </div>

            {error && <ErrorNote>{error}</ErrorNote>}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <CustomStatCard
                    icon={Receipt}
                    label="TOTAL TRANSAKSI"
                    value={loading ? "..." : String(rows.length)}
                    sub={`${rows.filter((r) => r.status === "success").length} lunas`}
                    iconBg="bg-blue-50 text-blue-600"
                />
                <CustomStatCard
                    icon={Wallet}
                    label="TOTAL DIBAYAR"
                    value={loading ? "..." : formatRupiah(totalLunas)}
                    sub="Pembayaran terkonfirmasi"
                    valueColor="text-emerald-600"
                    iconBg="bg-emerald-50 text-emerald-600"
                />
                <CustomStatCard
                    icon={PiggyBank}
                    label="HEMAT DARI KOLEKTIF"
                    value={loading ? "..." : formatRupiah(totalHemat)}
                    sub={
                        totalLunas > 0
                            ? `${((totalHemat / (totalLunas + totalHemat)) * 100).toFixed(1)}% dari harga normal`
                            : "Belum ada penghematan"
                    }
                    valueColor="text-blue-600"
                    iconBg="bg-blue-50 text-blue-600"
                />
                <CustomStatCard
                    icon={Clock}
                    label="MENUNGGU KONFIRMASI"
                    value={loading ? "..." : formatRupiah(totalMenunggu)}
                    sub="Belum diverifikasi pemasok"
                    valueColor="text-amber-500"
                    iconBg="bg-amber-50 text-amber-500"
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
                <div className="space-y-6">
                    <TableShell
                        head={["Bahan Baku", "Pemasok", "Jumlah", "Nilai", "Hemat", "Status", "Tanggal"]}
                        mobile={paginatedRows.map((r) => (
                            <div key={r.id} className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="truncate font-bold text-slate-900 text-base">
                                            {r.product.name}
                                        </div>
                                        <div className="truncate text-xs font-medium text-slate-500 mt-0.5">
                                            {r.supplier.groupName} · {formatNumber(r.quantity)}{" "}
                                            {r.product.unit}
                                        </div>
                                    </div>
                                    <PaymentBadge status={r.status} />
                                </div>

                                <div className="mt-4 flex items-baseline justify-between text-sm">
                                    <span className="font-extrabold text-slate-900 text-base">
                                        {formatRupiah(r.amount)}
                                    </span>
                                    {r.saving > 0 && (
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                            Hemat {formatRupiah(r.saving)}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-2 text-xs font-medium text-slate-400">
                                    {formatDate(r.createdAt)}
                                </div>
                            </div>
                        ))}
                    >
                        {paginatedRows.map((r) => (
                            <tr key={r.id} className="transition hover:bg-slate-50/80">
                                <td className="px-6 py-4 font-bold text-slate-900">{r.product.name}</td>
                                <td className="px-6 py-4 text-slate-600 font-medium">
                                    {r.supplier.groupName}
                                    <div className="text-xs font-normal text-slate-400">{r.supplier.city}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-semibold">
                                    {formatNumber(r.quantity)} {r.product.unit}
                                </td>
                                <td className="px-6 py-4 font-extrabold text-slate-900">
                                    {formatRupiah(r.amount)}
                                    {r.isBulkActive && (
                                        <div className="text-xs font-normal text-slate-400 line-through">
                                            {formatRupiah(r.normalPrice * r.quantity)}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-bold">
                                    {r.saving > 0 ? (
                                        <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                            {formatRupiah(r.saving)}
                                        </span>
                                    ) : (
                                        <span className="text-slate-300">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <PaymentBadge status={r.status} />
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-medium">{formatDate(r.createdAt)}</td>
                            </tr>
                        ))}
                    </TableShell>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <div className="text-xs font-medium text-slate-500">
                                Menampilkan halaman <strong className="text-slate-800">{currentPage}</strong> dari <strong className="text-slate-800">{totalPages}</strong> (Total {rows.length} transaksi)
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

// ============================================================
// Supplier — pembayaran masuk + verifikasi
// ============================================================

function SupplierTransactions() {
    const [rows, setRows] = useState<SupplierTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [filter, setFilter] = useState<TxStatus | "all">("all");
    const [currentPage, setCurrentPage] = useState(1);

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

    const totalPages = Math.ceil(visible.length / ITEMS_PER_PAGE);
    const paginatedVisible = visible.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const pemasukan = rows
        .filter((r) => r.status === "success")
        .reduce((s, r) => s + r.supplierPayout, 0);
    const menunggu = rows.filter((r) => r.status === "pending");

    return (
        <div className="flex flex-col gap-6 md:gap-8 pb-12">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 mb-2 border border-blue-100/60">
                    <CheckCircle2 size={14} /> Verifikasi Pemasukan
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Pembayaran Masuk Mitra
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
                    Kelola pembayaran dari UMKM untuk pesanan kolektif Anda. Lakukan konfirmasi segera setelah dana diterima.
                </p>
            </div>

            {error && <ErrorNote>{error}</ErrorNote>}

            <div className="grid gap-4 sm:grid-cols-3">
                <CustomStatCard
                    icon={Wallet}
                    label="DANA DITERIMA"
                    value={loading ? "..." : formatRupiah(pemasukan)}
                    sub="Setelah potongan komisi"
                    valueColor="text-emerald-600"
                    iconBg="bg-emerald-50 text-emerald-600"
                />
                <CustomStatCard
                    icon={Clock}
                    label="PERLU DIKONFIRMASI"
                    value={loading ? "..." : String(menunggu.length)}
                    sub={formatRupiah(menunggu.reduce((s, r) => s + r.amount, 0))}
                    valueColor="text-amber-500"
                    iconBg="bg-amber-50 text-amber-500"
                />
                <CustomStatCard
                    icon={Receipt}
                    label="TOTAL TRANSAKSI"
                    value={loading ? "..." : String(rows.length)}
                    sub="Sepanjang waktu"
                    iconBg="bg-blue-50 text-blue-600"
                />
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-2">
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
                            onClick={() => {
                                setFilter(f);
                                setCurrentPage(1);
                            }}
                            className={`shrink-0 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${filter === f
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {label} ({count})
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <SkeletonTable />
            ) : paginatedVisible.length === 0 ? (
                <EmptyState
                    title="Belum ada pembayaran"
                    body="Pembayaran akan muncul di sini setelah UMKM membayar pesanan kolektif Anda."
                />
            ) : (
                <div className="space-y-4">
                    {paginatedVisible.map((r) => (
                        <div
                            key={r.id}
                            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition hover:border-slate-300"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="font-extrabold text-slate-900 text-base">
                                            {r.umkm.businessName}
                                        </span>
                                        <PaymentBadge status={r.status} />
                                    </div>
                                    <div className="mt-1 text-xs font-medium text-slate-500">
                                        {r.product.name} · {formatNumber(r.quantity)}{" "}
                                        {r.product.unit} · {formatDate(r.createdAt)}
                                        {r.channel && ` · ${r.channel}`}
                                    </div>

                                    {r.adaBuktiBayar && (
                                        <div className="mt-3">
                                            <TombolLihatBukti transactionId={r.id} />
                                        </div>
                                    )}
                                </div>

                                <div className="text-right">
                                    <div className="font-display text-xl font-black text-slate-900">
                                        {formatRupiah(r.amount)}
                                    </div>
                                    <div className="text-xs font-bold text-emerald-600 mt-0.5">
                                        Bersih diterima: {formatRupiah(r.supplierPayout)}
                                    </div>
                                    <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                                        Komisi platform: {formatRupiah(r.platformFee)}
                                        {r.distributionMargin
                                            ? ` + margin ${formatRupiah(r.distributionMargin)}`
                                            : ""}
                                    </div>
                                </div>
                            </div>

                            {r.status === "success" && (
                                <div
                                    className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 text-xs font-semibold ${r.payoutStatus === "paid"
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                            : "bg-slate-50 text-slate-600 border border-slate-100"
                                        }`}
                                >
                                    <span>
                                        {r.payoutStatus === "paid"
                                            ? `Dana ${formatRupiah(r.supplierPayout)} sudah diteruskan${r.payoutAt ? ` pada ${formatDate(r.payoutAt)}` : ""
                                            }`
                                            : `Dana ${formatRupiah(r.supplierPayout)} menunggu diteruskan platform`}
                                    </span>

                                    {r.adaBuktiPayout && (
                                        <TombolLihatBukti
                                            transactionId={r.id}
                                            jenis="payout"
                                            label="Lihat bukti penerusan"
                                        />
                                    )}
                                </div>
                            )}

                            {r.status === "pending" && (
                                <div className="mt-5 flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => verify(r.id, "success")}
                                        disabled={busyId === r.id}
                                        className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-60"
                                    >
                                        {busyId === r.id ? "Memproses..." : "Konfirmasi Diterima"}
                                    </button>
                                    <button
                                        onClick={() => verify(r.id, "failed")}
                                        disabled={busyId === r.id}
                                        className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                                    >
                                        Tolak Pembayaran
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <div className="text-xs font-medium text-slate-500">
                                Menampilkan halaman <strong className="text-slate-800">{currentPage}</strong> dari <strong className="text-slate-800">{totalPages}</strong> (Total {visible.length} data)
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

// ============================================================
// Admin — seluruh transaksi platform
// ============================================================

function AdminTransactions() {
    const [rows, setRows] = useState<AdminTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

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
        load();
    }, [load]);

    const komisi = rows
        .filter((r) => r.status === "success")
        .reduce((s, r) => s + r.platformFee, 0);
    const gmv = rows.filter((r) => r.status === "success").reduce((s, r) => s + r.amount, 0);

    const totalPages = Math.ceil(rows.length / ITEMS_PER_PAGE);
    const paginatedRows = rows.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="flex flex-col gap-6 md:gap-8 pb-12">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 mb-2 border border-blue-100/60">
                    <TrendingUp size={14} /> Pengawasan Keuangan
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Seluruh Transaksi Platform
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
                    Monitor seluruh perputaran dana transaksi ekosistem beserta total komisi yang diperoleh platform.
                </p>
            </div>

            {error && <ErrorNote>{error}</ErrorNote>}

            <div className="grid gap-4 sm:grid-cols-3">
                <CustomStatCard
                    icon={TrendingUp}
                    label="NILAI TRANSAKSI (GMV)"
                    value={loading ? "..." : formatRupiah(gmv)}
                    sub="Transaksi terkonfirmasi"
                    iconBg="bg-blue-50 text-blue-600"
                />
                <CustomStatCard
                    icon={Wallet}
                    label="PENDAPATAN KOMISI"
                    value={loading ? "..." : formatRupiah(komisi)}
                    sub="Pemasukan PanganKreatif"
                    valueColor="text-emerald-600"
                    iconBg="bg-emerald-50 text-emerald-600"
                />
                <CustomStatCard
                    icon={Receipt}
                    label="JUMLAH TRANSAKSI"
                    value={loading ? "..." : String(rows.length)}
                    sub={`${rows.filter((r) => r.status === "pending").length} menunggu`}
                    valueColor="text-amber-500"
                    iconBg="bg-amber-50 text-amber-500"
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
                <div className="space-y-6">
                    <TableShell
                        head={["UMKM", "Pemasok", "Bahan Baku", "Nilai", "Komisi", "Status", "Tanggal"]}
                        mobile={paginatedRows.map((r) => (
                            <div key={r.id} className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="truncate font-bold text-slate-900 text-base">
                                            {r.umkm.businessName}
                                        </div>
                                        <div className="truncate text-xs font-medium text-slate-500 mt-0.5">
                                            {r.product.name} dari {r.supplier.groupName}
                                        </div>
                                    </div>
                                    <PaymentBadge status={r.status} />
                                </div>

                                <div className="mt-4 flex items-baseline justify-between text-sm">
                                    <span className="font-extrabold text-slate-900">{formatRupiah(r.amount)}</span>
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                        komisi {formatRupiah(r.platformFee)}
                                    </span>
                                </div>

                                <div className="mt-2 text-xs font-medium text-slate-400">
                                    {formatNumber(r.quantity)} {r.product.unit} · {formatDate(r.createdAt)}
                                </div>
                            </div>
                        ))}
                    >
                        {paginatedRows.map((r) => (
                            <tr key={r.id} className="transition hover:bg-slate-50/80">
                                <td className="px-6 py-4 font-bold text-slate-900">
                                    {r.umkm.businessName}
                                    <div className="text-xs font-normal text-slate-400">
                                        {r.umkm.city}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-medium">{r.supplier.groupName}</td>
                                <td className="px-6 py-4 text-slate-600">
                                    <span className="font-bold text-slate-800">{r.product.name}</span>
                                    <div className="text-xs text-slate-400">
                                        {formatNumber(r.quantity)} {r.product.unit}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-extrabold text-slate-900">{formatRupiah(r.amount)}</td>
                                <td className="px-6 py-4 font-bold text-emerald-600">
                                    {formatRupiah(r.platformFee)}
                                    <div className="text-xs font-normal text-slate-400">
                                        {(r.commissionRate * 100).toFixed(1)}%
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <PaymentBadge status={r.status} />
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-medium">{formatDate(r.createdAt)}</td>
                            </tr>
                        ))}
                    </TableShell>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <div className="text-xs font-medium text-slate-500">
                                Menampilkan halaman <strong className="text-slate-800">{currentPage}</strong> dari <strong className="text-slate-800">{totalPages}</strong> (Total {rows.length} transaksi)
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

// ============================================================
// Komponen Pendukung Kustom
// ============================================================

function CustomStatCard({
    icon: Icon,
    label,
    value,
    sub,
    valueColor = "text-slate-900",
    iconBg = "bg-blue-50 text-blue-600",
}: {
    icon: any;
    label: string;
    value: string;
    sub: string;
    valueColor?: string;
    iconBg?: string;
}) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                    {label}
                </span>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
                    <Icon size={20} />
                </div>
            </div>
            <div>
                <div className={`font-display text-xl sm:text-2xl font-black tracking-tight truncate ${valueColor}`} title={value}>
                    {value}
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500 truncate">
                    {sub}
                </div>
            </div>
        </div>
    );
}

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
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <table className="hidden w-full text-left text-sm md:table">
                <thead className="bg-slate-50/75 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-200">
                    <tr>
                        {head.map((h) => (
                            <th key={h} className="px-6 py-4">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">{children}</tbody>
            </table>

            <div className="divide-y divide-slate-100 md:hidden">{mobile}</div>
        </div>
    );
}

function EmptyState({ title, body }: { title: string; body: string }) {
    return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <Receipt size={36} className="mx-auto text-slate-400 mb-3" />
            <h3 className="font-display text-base font-bold text-slate-800">{title}</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 leading-relaxed">{body}</p>
        </div>
    );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 shadow-sm">
            {children}
        </div>
    );
}

function SkeletonTable() {
    return (
        <div className="space-y-4">
            {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-3xl bg-slate-100" />
            ))}
        </div>
    );
}   