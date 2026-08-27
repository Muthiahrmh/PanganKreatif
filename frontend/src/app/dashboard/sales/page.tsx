"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, History, FileText, Info, ChevronDown, Package, Edit3, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import type { SalesRecord } from "@/types/dashboard";

const schema = z.object({
    productName: z.string().min(1, "Nama bahan baku wajib diisi"),
    quantity: z.coerce.number().positive("Jumlah harus lebih dari 0"),
    unit: z.string().min(1, "Satuan wajib dipilih"),
    date: z.string().min(1, "Tanggal wajib diisi"),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const ITEMS_PER_PAGE = 8;
const UNIT_OPTIONS = ["kg", "gram", "ons", "liter", "ml", "pcs", "buah", "butir", "ekor", "ikat", "papan"];

function getExactUnit(productName: string) {
    const name = (productName || "").trim().toLowerCase();

    if (name.includes("minyak") || name.includes("kecap") || name.includes("saus") || name.includes("santan") || name.includes("air")) return "liter";
    if (name.includes("bayam") || name.includes("kangkung") || name.includes("kemangi")) return "ikat";
    if (name.includes("telur") || name.includes("kelapa")) return "butir";
    if (name.includes("tempe") || name.includes("pete")) return "papan";
    if (name.includes("ayam (ekor)") || name.includes("ikan") || name.includes("lele")) return "ekor";

    return "kg";
}

export default function SalesRecordsPage() {
    const [records, setRecords] = useState<SalesRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<FormInput, unknown, FormOutput>({
        resolver: zodResolver(schema),
        defaultValues: {
            date: new Date().toISOString().slice(0, 10),
            unit: "kg"
        },
    });

    const selectedUnit = watch("unit");
    const watchedProductName = watch("productName");

    useEffect(() => {
        if (watchedProductName) {
            const detectedUnit = getExactUnit(watchedProductName);
            setValue("unit", detectedUnit);
        }
    }, [watchedProductName, setValue]);

    async function loadRecords() {
        setLoading(true);
        try {
            const res = await api.get<SalesRecord[]>("/sales-records");
            setRecords(res.data);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadRecords();
    }, []);

    async function onSubmit(data: FormOutput) {
        setError(null);
        try {
            const normalizedProductName = data.productName
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            await api.post("/sales-records", { ...data, productName: normalizedProductName });
            reset({ productName: "", quantity: undefined, unit: "kg", date: data.date });
            await loadRecords();
            setCurrentPage(1);
        } catch (err) {
            setError(getApiErrorMessage(err));
        }
    }

    const uniqueProducts = useMemo(() => {
        const names = records.map((r) => r.productName);
        return Array.from(new Set(names)).sort();
    }, [records]);

    const totalPages = Math.ceil(records.length / ITEMS_PER_PAGE);
    const paginatedRecords = records.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="flex flex-col gap-6 pb-10">

            {/* Header Standar (Menyesuaikan halaman Procurement) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 mb-3 border border-blue-100/60">
                    <ClipboardList size={14} /> Pencatatan Operasional
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Pusat Data Bahan Baku
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
                    Kumpulkan riwayat belanja dan pemakaian Anda di sini. Data yang konsisten akan menghasilkan prediksi AI yang sangat presisi.
                </p>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.4fr]">

                {/* Form Tambah Catatan */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm relative flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <Edit3 size={20} strokeWidth={2.2} />
                        </div>
                        <div>
                            <h3 className="font-display text-lg font-extrabold text-slate-900">Input Data Harian</h3>
                            <p className="text-xs text-slate-500">Catat estimasi belanja atau pemakaian harian.</p>
                        </div>
                    </div>

                    <div className="mb-6 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Info size={15} className="text-blue-600" />
                            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Panduan Pencatatan</h4>
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-600 font-medium list-disc pl-4 leading-relaxed">
                            <li>
                                <strong>Tidak perlu hitung sisa dapur:</strong> Cukup masukkan <strong>total belanjaan dari pasar hari ini</strong>.
                            </li>
                            <li>
                                <strong>Konversi ke satuan pasti:</strong> Jika beli 1 karung beras 25kg, masukkan <strong>25</strong> lalu pilih <strong>kg</strong>.
                            </li>
                        </ul>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 flex-1">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="productName" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                Nama Bahan Baku
                            </label>
                            <input
                                id="productName"
                                list="existing-products"
                                placeholder="Ketik nama bahan baku..."
                                autoComplete="off"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                {...register("productName")}
                            />
                            <datalist id="existing-products">
                                {uniqueProducts.map((name) => (
                                    <option key={name} value={name} />
                                ))}
                            </datalist>
                            {errors.productName?.message && (
                                <span className="text-[11px] font-bold text-red-500 px-1">{errors.productName.message}</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                Jumlah Pembelian
                            </label>
                            <div className="flex gap-2.5">
                                <div className="flex-1">
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Misal: 5"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                        {...register("quantity")}
                                    />
                                </div>

                                {/* Dropdown Satuan */}
                                <div className="relative w-[110px] shrink-0">
                                    <input type="hidden" {...register("unit")} />
                                    <button
                                        type="button"
                                        onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold outline-none transition-all ${unitDropdownOpen
                                                ? "border-blue-500 bg-white ring-1 ring-blue-500 text-slate-900"
                                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                            }`}
                                    >
                                        <span>{selectedUnit}</span>
                                        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${unitDropdownOpen ? "rotate-180 text-blue-500" : ""}`} />
                                    </button>

                                    {unitDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setUnitDropdownOpen(false)} />
                                            <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-32 max-h-56 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-lg ring-1 ring-slate-900/5">
                                                {UNIT_OPTIONS.map((u) => (
                                                    <button
                                                        key={u}
                                                        type="button"
                                                        onClick={() => {
                                                            setValue("unit", u, { shouldValidate: true });
                                                            setUnitDropdownOpen(false);
                                                        }}
                                                        className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${selectedUnit === u
                                                                ? "bg-blue-50 text-blue-700"
                                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                            }`}
                                                    >
                                                        {u}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            {(errors.quantity?.message || errors.unit?.message) && (
                                <span className="text-[11px] font-bold text-red-500 px-1">
                                    {errors.quantity?.message || errors.unit?.message}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                Tanggal Pencatatan
                            </label>
                            <input
                                type="date"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                {...register("date")}
                            />
                            {errors.date?.message && (
                                <span className="text-[11px] font-bold text-red-500 px-1">{errors.date.message}</span>
                            )}
                        </div>

                        {error && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-600 mt-2">
                                {error}
                            </div>
                        )}

                        <Button type="submit" loading={isSubmitting} className="mt-auto w-full h-[46px] rounded-2xl font-bold shadow-md bg-blue-600 hover:bg-blue-700">
                            <Plus size={16} className="mr-1.5" /> Simpan Catatan
                        </Button>
                    </form>
                </div>

                {/* List Riwayat Penjualan */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col h-full relative z-0">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                            <History size={20} />
                        </span>
                        <div>
                            <h3 className="font-display text-lg font-extrabold text-slate-900">Histori Tercatat</h3>
                            <p className="text-xs text-slate-500">Total {records.length} catatan tersimpan</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-sm font-medium text-slate-400">Memuat data histori...</div>
                    ) : records.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-xs font-medium text-slate-500 my-auto">
                            Belum ada catatan bahan baku yang tersimpan.
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col justify-between">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
                                            <th className="pb-3 px-3">Bahan Baku</th>
                                            <th className="pb-3 px-3">Jumlah</th>
                                            <th className="pb-3 px-3">Tanggal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedRecords.map((r) => {
                                            const displayUnit = (r as any).unit || getExactUnit(r.productName);
                                            return (
                                                <tr key={r.id} className="transition hover:bg-slate-50/80">
                                                    <td className="py-4 px-3 font-bold text-slate-900">{r.productName}</td>
                                                    <td className="py-4 px-3 font-extrabold text-blue-600">
                                                        {r.quantity} <span className="text-xs font-semibold text-slate-500 ml-0.5">{displayUnit}</span>
                                                    </td>
                                                    <td className="py-4 px-3 font-medium text-slate-500">
                                                        {new Date(r.date).toLocaleDateString("id-ID", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                                    <div className="text-xs font-medium text-slate-500">
                                        Halaman <strong className="text-slate-800">{currentPage}</strong> dari <strong className="text-slate-800">{totalPages}</strong>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft size={14} /> Sebelumnya
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Berikutnya <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}