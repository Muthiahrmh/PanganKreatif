"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { fetchMyProducts } from "@/lib/supplier";
import type { SupplierProduct } from "@/types/supplier";

const optionalNumber = z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().positive("Harus lebih dari 0").optional()
);

const schema = z
    .object({
        name: z.string().min(1, "Nama produk wajib diisi"),
        category: z.string().min(1, "Kategori wajib diisi"),
        unit: z.string().min(1, "Satuan wajib diisi"),
        price: z.coerce.number().positive("Harga harus lebih dari 0"),
        stock: z.coerce.number().int().nonnegative("Stok tidak boleh minus"),
        bulkPrice: optionalNumber,
        bulkMinQty: optionalNumber,
    })
    .refine(
        (d) => (d.bulkPrice == null) === (d.bulkMinQty == null),
        { message: "Isi harga grosir dan minimal kuantitasnya sekaligus", path: ["bulkPrice"] }
    )
    .refine((d) => d.bulkPrice == null || d.bulkPrice < d.price, {
        message: "Harga grosir harus lebih murah dari harga normal",
        path: ["bulkPrice"],
    });

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export default function SupplierProductsPage() {
    const user = useAuthStore((s) => s.user);
    const [products, setProducts] = useState<SupplierProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { isSubmitting },
    } = useForm<FormInput, unknown, FormOutput>({ resolver: zodResolver(schema) });

    async function loadProducts() {
        setLoading(true);
        try {
            // Endpoint ini sudah difilter di server, jadi cuma produk milik sendiri
            setProducts(await fetchMyProducts());
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadProducts();
    }, [user]);

    function openAddForm() {
        setEditingId(null);
        reset({
            name: "",
            category: "",
            unit: "",
            price: "",
            stock: "",
            bulkPrice: "",
            bulkMinQty: "",
        });
        setShowForm(true);
    }

    function openEditForm(product: SupplierProduct) {
        setEditingId(product.id);
        reset({
            name: product.name,
            category: product.category,
            unit: product.unit,
            price: Number(product.price),
            stock: product.stock,
            bulkPrice: product.bulkPrice ?? "",
            bulkMinQty: product.bulkMinQty ?? "",
        });
        setShowForm(true);
    }

    async function onSubmit(data: FormOutput) {
        setError(null);
        try {
            // Kirim null kalau kosong, supaya harga grosir bisa dihapus
            const payload = {
                ...data,
                bulkPrice: data.bulkPrice ?? null,
                bulkMinQty: data.bulkMinQty ?? null,
            };

            if (editingId) {
                await api.put(`/products/${editingId}`, payload);
            } else {
                await api.post("/products", payload);
            }
            setShowForm(false);
            await loadProducts();
        } catch (err) {
            setError(getApiErrorMessage(err));
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Yakin mau hapus produk ini?")) return;
        setError(null);
        try {
            await api.delete(`/products/${id}`);
            await loadProducts();
        } catch (err) {
            setError(getApiErrorMessage(err));
        }
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-display text-xl font-bold text-ink">Produk Saya</h2>
                    <p className="mt-1 text-sm text-ink-soft">Kelola katalog bahan baku yang kamu jual.</p>
                </div>
                <Button onClick={openAddForm}>
                    <Plus size={16} /> Tambah Produk
                </Button>
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            {showForm && (
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid gap-4 rounded-xl border border-ink/5 bg-white p-5 sm:grid-cols-2"
                >
                    <div className="flex items-center justify-between sm:col-span-2">
                        <h3 className="font-display text-sm font-bold text-ink">
                            {editingId ? "Edit Produk" : "Produk Baru"}
                        </h3>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="text-ink-soft hover:text-ink"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <TextField label="Nama produk" placeholder="Cabai Merah" {...register("name")} />
                    <TextField label="Kategori" placeholder="Sayuran" {...register("category")} />
                    <TextField label="Satuan" placeholder="kg" {...register("unit")} />
                    <TextField
                        label="Harga per satuan (Rp)"
                        type="number"
                        placeholder="28000"
                        {...register("price")}
                    />
                    <TextField label="Stok" type="number" placeholder="100" {...register("stock")} />

                    <div className="rounded-lg bg-paper-soft p-4 sm:col-span-2">
                        <h4 className="text-sm font-semibold text-ink">
                            Harga grosir (opsional)
                        </h4>
                        <p className="mt-1 text-xs text-ink-soft">
                            Kalau total pesanan kolektif mencapai jumlah minimal, semua UMKM yang
                            ikut otomatis dapat harga ini. Kosongkan kalau belum mau pakai.
                        </p>

                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                            <TextField
                                label="Harga grosir (Rp)"
                                type="number"
                                placeholder="25000"
                                {...register("bulkPrice")}
                            />
                            <TextField
                                label="Minimal total pesanan"
                                type="number"
                                placeholder="100"
                                {...register("bulkMinQty")}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <Button type="submit" loading={isSubmitting}>
                            {editingId ? "Simpan Perubahan" : "Tambah Produk"}
                        </Button>
                    </div>
                </form>
            )}

            <div className="overflow-x-auto rounded-xl border border-ink/5 bg-white p-5">
                {loading ? (
                    <p className="text-sm text-ink-soft">Memuat produk...</p>
                ) : products.length === 0 ? (
                    <p className="text-sm text-ink-soft">Belum ada produk. Tambah produk pertama kamu.</p>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-ink/10 text-xs text-ink-soft">
                                <th className="pb-2 font-medium">Nama</th>
                                <th className="pb-2 font-medium">Kategori</th>
                                <th className="pb-2 font-medium">Harga</th>
                                <th className="pb-2 font-medium">Stok</th>
                                <th className="pb-2 font-medium">Pesanan</th>
                                <th className="pb-2 text-right font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id} className="border-b border-ink/5 last:border-0">
                                    <td className="py-2.5 font-medium text-ink">{p.name}</td>
                                    <td className="py-2.5 text-ink-soft">{p.category}</td>
                                    <td className="py-2.5 text-ink-soft">
                                        Rp{Number(p.price).toLocaleString("id-ID")}/{p.unit}
                                        {p.bulkPrice != null && p.bulkMinQty != null && (
                                            <div className="text-xs text-brand-green">
                                                grosir Rp
                                                {Number(p.bulkPrice).toLocaleString("id-ID")} min{" "}
                                                {p.bulkMinQty} {p.unit}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-2.5">
                                        <span className={p.stock <= 10 ? "font-medium text-amber-600" : "text-ink-soft"}>
                                            {p.stock}
                                        </span>
                                    </td>
                                    <td className="py-2.5 text-ink-soft">{p.orderCount}</td>
                                    <td className="py-2.5">
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => openEditForm(p)} className="text-brand-blue hover:opacity-70">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:opacity-70">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}