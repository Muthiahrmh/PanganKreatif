"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, X, Package, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { temaPeran } from "@/components/dashboard/roleTheme";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { DialogKonfirmasi } from "@/components/dashboard/DialogKonfirmasi";
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

const ITEMS_PER_PAGE = 5;

export default function SupplierProductsPage() {
    const user = useAuthStore((s) => s.user);
    const tema = temaPeran(user?.role ?? "supplier");
    const warnaPeran = {
        "--warna-peran": tema.aksen,
        "--warna-peran-latar": tema.latar,
        "--warna-gelap": tema.sidebar,
    } as CSSProperties;
    const [products, setProducts] = useState<SupplierProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [hapusTarget, setHapusTarget] = useState<SupplierProduct | null>(null);
    const [menghapus, setMenghapus] = useState(false);

    // State untuk Pagination
    const [currentPage, setCurrentPage] = useState(1);

    const {
        register,
        handleSubmit,
        reset,
        formState: { isSubmitting },
    } = useForm<FormInput, unknown, FormOutput>({ resolver: zodResolver(schema) });

    async function loadProducts() {
        setLoading(true);
        try {
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
        setError(null);
        setMenghapus(true);
        try {
            await api.delete(`/products/${id}`);
            await loadProducts();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setMenghapus(false);
            setHapusTarget(null);
        }
    }

    // Kalkulasi Pagination
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    const paginatedProducts = products.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    if (user && user.role !== "supplier") {
        return <p className="text-sm font-medium text-slate-500 p-6">Halaman ini khusus untuk akun pemasok / tani.</p>;
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
                            Manajemen Inventaris & Katalog
                        </div>
                        <h2 className="mt-4 font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
                            Katalog Produk Saya
                        </h2>
                        <p className="mt-2 text-sm font-medium text-white/70 max-w-xl leading-relaxed">
                            Kelola daftar bahan baku dan atur penawaran harga grosir khusus untuk pesanan kolektif UMKM.
                        </p>
                    </div>

                    <Button onClick={openAddForm} className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-md hover:bg-white/90 shrink-0">
                        <Plus size={18} strokeWidth={2.5} /> Tambah Produk Baru
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700 shadow-sm">
                    {error}
                </div>
            )}

            {/* Form Tambah / Edit Produk */}
            {showForm && (
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="relative overflow-hidden grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:grid-cols-2"
                >
                    <span className="absolute inset-x-0 top-0 h-1.5 bg-[var(--warna-peran)]" />
                    <div className="flex items-center justify-between sm:col-span-2 pb-4 border-b border-slate-100">
                        <div>
                            <div className="text-[11px] font-bold text-[var(--warna-peran)] uppercase tracking-wider">Formulir Katalog</div>
                            <h3 className="font-display text-lg font-extrabold text-slate-900 mt-0.5">
                                {editingId ? "Ubah Informasi Produk" : "Daftarkan Produk Baru"}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            aria-label="Tutup"
                            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <TextField label="Nama Produk" placeholder="Misal: Cabai Merah Keriting" {...register("name")} />
                    <TextField label="Kategori" placeholder="Misal: Sayuran / Rempah" {...register("category")} />
                    <TextField label="Satuan Unit" placeholder="Misal: kg / liter / ikat" {...register("unit")} />
                    <TextField
                        label="Harga Normal per Satuan (Rp)"
                        type="number"
                        placeholder="28000"
                        {...register("price")}
                    />
                    <TextField label="Stok Tersedia" type="number" placeholder="100" {...register("stock")} />

                    <div className="rounded-2xl border border-[var(--warna-peran)]/20 bg-[var(--warna-peran-latar)] p-5 sm:col-span-2 space-y-3">
                        <div className="flex items-center gap-2">
                            <Layers size={16} className="text-[var(--warna-peran)]" />
                            <h4 className="text-sm font-bold text-slate-900">
                                Pengaturan Harga Grosir (Opsional)
                            </h4>
                        </div>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed">
                            Jika total pesanan kolektif dari berbagai UMKM mencapai kuota minimal, sistem akan otomatis menerapkan harga grosir ini untuk semua peserta.
                        </p>

                        <div className="grid gap-4 sm:grid-cols-2 pt-2">
                            <TextField
                                label="Harga Diskon Grosir (Rp)"
                                type="number"
                                placeholder="25000"
                                {...register("bulkPrice")}
                            />
                            <TextField
                                label="Minimal Total Kuota Pesanan"
                                type="number"
                                placeholder="100"
                                {...register("bulkMinQty")}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2 pt-2">
                        <Button type="submit" loading={isSubmitting} className="rounded-2xl bg-[var(--warna-peran)] px-6 py-3 text-sm font-bold shadow-md hover:brightness-90">
                            {editingId ? "Simpan Perubahan" : "Tambahkan ke Katalog"}
                        </Button>
                    </div>
                </form>
            )}

            {/* Daftar Produk */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <span className="absolute inset-x-0 top-0 h-1.5 bg-slate-300" />
                {loading ? (
                    <div className="py-12 text-center text-sm font-medium text-slate-400">Memuat katalog produk...</div>
                ) : products.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                        <Package size={32} className="mx-auto text-slate-400 mb-3" />
                        <h3 className="font-display text-base font-bold text-slate-800">Katalog masih kosong</h3>
                        <p className="mt-1 text-sm text-slate-500">Belum ada produk yang terdaftar. Tambahkan produk pertamamu sekarang.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
                                        <th className="pb-3 px-4">Nama Produk</th>
                                        <th className="pb-3 px-4">Kategori</th>
                                        <th className="pb-3 px-4">Harga Normal / Grosir</th>
                                        <th className="pb-3 px-4">Stok Gudang</th>
                                        <th className="pb-3 px-4">Pesanan Aktif</th>
                                        <th className="pb-3 px-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedProducts.map((p) => (
                                        <tr key={p.id} className="transition hover:bg-slate-50/80">
                                            <td className="py-4 px-4 font-bold text-slate-900">{p.name}</td>
                                            <td className="py-4 px-4 font-medium text-slate-600">{p.category}</td>
                                            <td className="py-4 px-4 font-semibold text-slate-800">
                                                Rp{Number(p.price).toLocaleString("id-ID")}/{p.unit}
                                                {p.bulkPrice != null && p.bulkMinQty != null && (
                                                    <div className="text-xs font-bold text-[var(--warna-peran)] mt-0.5">
                                                        Grosir: Rp{Number(p.bulkPrice).toLocaleString("id-ID")} (min {p.bulkMinQty} {p.unit})
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 font-bold">
                                                <span className={p.stock <= 10 ? "text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-xs" : "text-slate-700"}>
                                                    {p.stock} {p.unit}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 font-semibold text-slate-600">{p.orderCount} sesi</td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openEditForm(p)} className="rounded-xl border border-slate-200 bg-white p-2 text-[var(--warna-peran)] shadow-sm transition hover:bg-slate-50" title="Edit">
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button onClick={() => setHapusTarget(p)} className="rounded-xl border border-slate-200 bg-white p-2 text-red-500 shadow-sm transition hover:bg-slate-50" title="Hapus">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Tampilan kartu untuk layar kecil */}
                        <div className="space-y-3 md:hidden">
                            {paginatedProducts.map((p) => (
                                <div key={p.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-base">{p.name}</h4>
                                            <span className="text-xs font-semibold text-slate-500">{p.category} · {p.orderCount} pesanan aktif</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => openEditForm(p)} className="rounded-xl bg-white border border-slate-200 p-2 text-[var(--warna-peran)] shadow-sm">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => setHapusTarget(p)} className="rounded-xl bg-white border border-slate-200 p-2 text-red-500 shadow-sm">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between text-xs font-bold pt-3 border-t border-slate-200">
                                        <span className="text-slate-800">Rp{Number(p.price).toLocaleString("id-ID")}/{p.unit}</span>
                                        <span className={p.stock <= 10 ? "text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md" : "text-slate-600"}>
                                            Stok: {p.stock} {p.unit}
                                        </span>
                                    </div>

                                    {p.bulkPrice != null && p.bulkMinQty != null && (
                                        <div className="mt-2 text-[11px] font-bold text-[var(--warna-peran)] bg-[var(--warna-peran-latar)] px-2.5 py-1 rounded-lg border border-[var(--warna-peran)]/20">
                                            Grosir: Rp{Number(p.bulkPrice).toLocaleString("id-ID")} (min {p.bulkMinQty} {p.unit})
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Kontrol Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-200 pt-6 mt-6">
                                <div className="text-xs font-medium text-slate-500">
                                    Menampilkan halaman <strong className="text-slate-800">{currentPage}</strong> dari <strong className="text-slate-800">{totalPages}</strong>
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
                                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                                    >
                                        Berikutnya <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <DialogKonfirmasi
                terbuka={hapusTarget !== null}
                sibuk={menghapus}
                bahaya
                judul="Hapus produk dari katalog?"
                pesan={
                    hapusTarget
                        ? `${hapusTarget.name} akan dihapus dan tidak dapat dipesan kembali oleh UMKM.`
                        : ""
                }
                keterangan={
                    hapusTarget && hapusTarget.orderCount > 0
                        ? `Produk ini sedang terikat pada ${hapusTarget.orderCount} sesi pesanan kolektif aktif. Pesanan tersebut juga akan terpengaruh.`
                        : "Tindakan ini permanen dan tidak dapat dibatalkan."
                }
                labelYa="Hapus Produk"
                onBatal={() => setHapusTarget(null)}
                onYa={() => {
                    if (hapusTarget) handleDelete(hapusTarget.id);
                }}
            />
        </div>
    );
}