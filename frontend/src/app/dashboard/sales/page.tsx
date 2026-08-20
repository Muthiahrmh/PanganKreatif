"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import type { SalesRecord } from "@/types/dashboard";

const schema = z.object({
    productName: z.string().min(1, "Nama bahan baku wajib diisi"),
    quantity: z.coerce.number().positive("Jumlah harus lebih dari 0"),
    date: z.string().min(1, "Tanggal wajib diisi"),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export default function SalesRecordsPage() {
    const [records, setRecords] = useState<SalesRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormInput, unknown, FormOutput>({
        resolver: zodResolver(schema),
        defaultValues: { date: new Date().toISOString().slice(0, 10) },
    });

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadRecords();
    }, []);

    async function onSubmit(data: FormOutput) {
        setError(null);
        try {
            await api.post("/sales-records", data);
            reset({ productName: "", quantity: undefined, date: data.date });
            loadRecords();
        } catch (err) {
            setError(getApiErrorMessage(err));
        }
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            {/* Form tambah */}
            <div className="h-fit rounded-xl border border-ink/5 bg-white p-5">
                <h3 className="font-display text-sm font-bold text-ink">Catat Penjualan</h3>
                <p className="mt-1 text-xs text-ink-soft">
                    Semakin lengkap histori kamu catat, semakin akurat prediksi AI-nya.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-3">
                    <TextField
                        label="Nama bahan baku"
                        placeholder="Contoh: Cabai Merah"
                        error={errors.productName?.message}
                        {...register("productName")}
                    />
                    <TextField
                        label="Jumlah terpakai"
                        type="number"
                        step="0.01"
                        placeholder="Contoh: 5"
                        error={errors.quantity?.message}
                        {...register("quantity")}
                    />
                    <TextField
                        label="Tanggal"
                        type="date"
                        error={errors.date?.message}
                        {...register("date")}
                    />

                    {error && (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
                    )}

                    <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
                        <Plus size={15} /> Simpan Catatan
                    </Button>
                </form>
            </div>

            {/* List riwayat */}
            <div className="rounded-xl border border-ink/5 bg-white p-5">
                <h3 className="font-display text-sm font-bold text-ink">Riwayat Penjualan</h3>

                {loading ? (
                    <p className="mt-4 text-sm text-ink-soft">Memuat data...</p>
                ) : records.length === 0 ? (
                    <p className="mt-4 text-sm text-ink-soft">
                        Belum ada catatan penjualan. Mulai catat di form sebelah biar prediksi AI bisa jalan.
                    </p>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-ink/10 text-xs text-ink-soft">
                                    <th className="pb-2 font-medium">Bahan Baku</th>
                                    <th className="pb-2 font-medium">Jumlah</th>
                                    <th className="pb-2 font-medium">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((r) => (
                                    <tr key={r.id} className="border-b border-ink/5 last:border-0">
                                        <td className="py-2.5 font-medium text-ink">{r.productName}</td>
                                        <td className="py-2.5 text-ink-soft">{r.quantity}</td>
                                        <td className="py-2.5 text-ink-soft">
                                            {new Date(r.date).toLocaleDateString("id-ID", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
