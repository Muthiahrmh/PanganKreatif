"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Trash2, Check, KeyRound, User, Building, ShieldCheck, Landmark } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/lib/api";
import {
    changePassword,
    deleteAvatar,
    fetchProfile,
    updateProfile,
    uploadAvatar,
} from "@/lib/profile";
import { formatDate } from "@/lib/format";
import type { EwalletProvider, ProfilePayload } from "@/types/auth";

const emptyForm: ProfilePayload = {
    name: "",
    phone: "",
    businessName: "",
    businessType: "",
    groupName: "",
    city: "",
    address: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountHolder: "",
    ewalletNumber: "",
    ewalletHolder: "",
    ewalletProviders: [],
};

const DAFTAR_EWALLET: { value: EwalletProvider; label: string }[] = [
    { value: "dana", label: "DANA" },
    { value: "gopay", label: "GoPay" },
    { value: "shopeepay", label: "ShopeePay" },
    { value: "ovo", label: "OVO" },
];

export default function ProfilePage() {
    const user = useAuthStore((s) => s.user);
    const updateUser = useAuthStore((s) => s.updateUser);

    const [form, setForm] = useState<ProfilePayload>(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const isSupplier = user?.role === "supplier";
    const isAdmin = user?.role === "admin";

    const load = useCallback(async () => {
        try {
            const data = await fetchProfile();
            updateUser(data);
            setForm({
                name: data.name ?? "",
                phone: data.phone ?? "",
                businessName: data.umkmProfile?.businessName ?? "",
                businessType: data.umkmProfile?.businessType ?? "",
                groupName: data.supplierProfile?.groupName ?? "",
                city: data.umkmProfile?.city ?? data.supplierProfile?.city ?? "",
                address: data.umkmProfile?.address ?? data.supplierProfile?.address ?? "",
                bankName: data.supplierProfile?.bankName ?? "",
                bankAccountNumber: data.supplierProfile?.bankAccountNumber ?? "",
                bankAccountHolder: data.supplierProfile?.bankAccountHolder ?? "",
                ewalletNumber: data.supplierProfile?.ewalletNumber ?? "",
                ewalletHolder: data.supplierProfile?.ewalletHolder ?? "",
                ewalletProviders: data.supplierProfile?.ewalletProviders ?? [],
            });
            setError(null);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [updateUser]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    function flash(message: string) {
        setSuccess(message);
        window.setTimeout(() => setSuccess(null), 3000);
    }

    async function handleSave() {
        setSaving(true);
        setError(null);
        try {
            const payload: ProfilePayload = {
                name: form.name,
                phone: form.phone || null,
            };
            if (!isAdmin) {
                payload.city = form.city;
                payload.address = form.address;
                if (isSupplier) {
                    payload.groupName = form.groupName;
                    payload.bankName = form.bankName || null;
                    payload.bankAccountNumber = form.bankAccountNumber || null;
                    payload.bankAccountHolder = form.bankAccountHolder || null;
                    payload.ewalletNumber = form.ewalletNumber || null;
                    payload.ewalletHolder = form.ewalletHolder || null;
                    payload.ewalletProviders = form.ewalletProviders ?? [];
                } else {
                    payload.businessName = form.businessName;
                    payload.businessType = form.businessType;
                }
            }

            const updated = await updateProfile(payload);
            updateUser(updated);
            flash("Profil berhasil diperbarui dan disimpan");
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        try {
            const updated = await uploadAvatar(file);
            updateUser(updated);
            flash("Foto profil berhasil diperbarui");
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    async function handleDeletePhoto() {
        if (!window.confirm("Apakah Anda yakin ingin menghapus foto profil?")) return;
        setUploading(true);
        try {
            const updated = await deleteAvatar();
            updateUser(updated);
            flash("Foto profil berhasil dihapus");
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setUploading(false);
        }
    }

    if (!user) return null;

    const initial = (user.name ?? "U").charAt(0).toUpperCase();

    return (
        <div className="flex flex-col gap-6 md:gap-8 pb-10">
            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 shadow-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 shadow-sm">
                    <Check size={16} className="text-emerald-600 shrink-0" /> {success}
                </div>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-[380px_1fr]">
                {/* Kolom kiri: Foto Profil & Keamanan */}
                <div className="flex flex-col gap-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-4">
                            <User size={15} /> Identitas Visual
                        </div>
                        <h3 className="font-display text-lg font-extrabold text-slate-900">Foto Profil</h3>

                        <div className="mt-6 flex flex-col items-center gap-5 text-center">
                            <div className="relative">
                                {user.avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={user.avatarUrl}
                                        alt="Foto profil"
                                        className="h-36 w-36 rounded-full object-cover ring-4 ring-slate-100 shadow-md"
                                    />
                                ) : (
                                    <div className="flex h-36 w-36 items-center justify-center rounded-full bg-blue-600 font-display text-4xl font-extrabold text-white shadow-md">
                                        {initial}
                                    </div>
                                )}

                                {uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/40 backdrop-blur-sm">
                                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    </div>
                                )}
                            </div>

                            <div className="w-full">
                                <div className="flex flex-wrap justify-center gap-2.5">
                                    <button
                                        onClick={() => fileRef.current?.click()}
                                        disabled={uploading}
                                        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        <Camera size={15} />
                                        {user.avatarUrl ? "Ganti Foto" : "Unggah Foto"}
                                    </button>

                                    {user.avatarUrl && (
                                        <button
                                            onClick={handleDeletePhoto}
                                            disabled={uploading}
                                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                                        >
                                            <Trash2 size={15} /> Hapus
                                        </button>
                                    )}
                                </div>

                                <p className="mt-3 text-[11px] font-medium text-slate-400">
                                    Format JPG, PNG, atau WEBP. Maksimal ukuran berkas 2 MB.
                                </p>
                            </div>

                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFile}
                                className="hidden"
                            />
                        </div>
                    </div>

                    <PasswordCard onDone={flash} onError={setError} />
                </div>

                {/* Kolom kanan: Data Usaha */}
                <div className="flex flex-col gap-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                            <Building size={15} /> Informasi Akun & Operasional
                        </div>
                        <h3 className="font-display text-xl font-extrabold text-slate-900 tracking-tight">
                            {isAdmin ? "Data Akun Administrator" : "Data Profil Usaha"}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                            Perbarui informasi kontak dan alamat operasional Anda di sini.
                        </p>

                        {loading ? (
                            <div className="mt-6 space-y-4">
                                {[0, 1, 2, 3].map((i) => (
                                    <div key={i} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                    <Field label="Nama Lengkap">
                                        <input
                                            value={form.name ?? ""}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className={inputClass}
                                        />
                                    </Field>

                                    <Field label="Alamat Email (Akun)" hint="Email terdaftar tidak dapat diubah">
                                        <input
                                            value={user.email}
                                            disabled
                                            className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-500`}
                                        />
                                    </Field>

                                    <Field label="Nomor Telepon / WhatsApp">
                                        <input
                                            value={form.phone ?? ""}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            placeholder="08xxxxxxxxxx"
                                            className={inputClass}
                                        />
                                    </Field>

                                    {!isAdmin && (
                                        <>
                                            <Field label={isSupplier ? "Nama Kelompok Tani / Distributor" : "Nama Bisnis / Usaha"}>
                                                <input
                                                    value={
                                                        (isSupplier ? form.groupName : form.businessName) ?? ""
                                                    }
                                                    onChange={(e) =>
                                                        setForm(
                                                            isSupplier
                                                                ? { ...form, groupName: e.target.value }
                                                                : { ...form, businessName: e.target.value }
                                                        )
                                                    }
                                                    className={inputClass}
                                                />
                                            </Field>

                                            {!isSupplier && (
                                                <Field label="Jenis Usaha UMKM">
                                                    <input
                                                        value={form.businessType ?? ""}
                                                        onChange={(e) =>
                                                            setForm({ ...form, businessType: e.target.value })
                                                        }
                                                        placeholder="Katering, Warung Nasi, Kafe"
                                                        className={inputClass}
                                                    />
                                                </Field>
                                            )}

                                            <Field label="Kota / Kabupaten">
                                                <input
                                                    value={form.city ?? ""}
                                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                                    className={inputClass}
                                                />
                                            </Field>

                                            <div className="sm:col-span-2">
                                                <Field label="Alamat Lengkap">
                                                    <textarea
                                                        value={form.address ?? ""}
                                                        onChange={(e) =>
                                                            setForm({ ...form, address: e.target.value })
                                                        }
                                                        rows={3}
                                                        className={inputClass}
                                                    />
                                                </Field>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-60"
                                    >
                                        {saving ? "Menyimpan Perubahan..." : "Simpan Perubahan Profil"}
                                    </button>

                                    {user.createdAt && (
                                        <span className="text-xs font-semibold text-slate-400">
                                            Bergabung sejak {formatDate(user.createdAt)}
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Khusus Supplier: Rekening Pencairan (Dipindah ke Luar Grid Biar Full Width & Balance) */}
            {isSupplier && !loading && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                        <Landmark size={15} /> Pengaturan Finansial
                    </div>
                    <h3 className="font-display text-xl font-extrabold text-slate-900 tracking-tight">
                        Rekening Penerimaan Dana
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500 leading-relaxed max-w-3xl">
                        Pembayaran dari UMKM ditampung di rekening platform, lalu diteruskan ke rekening ini setelah dipotong komisi layanan. UMKM yang membayar manual juga melihat rekening ini sebagai tujuan transfer.
                    </p>

                    <div className="mt-6 grid gap-5 sm:grid-cols-3">
                        <Field label="Nama Bank">
                            <input
                                value={form.bankName ?? ""}
                                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                                placeholder="Misal: Bank Mandiri / BCA / BSI"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Nomor Rekening">
                            <input
                                value={form.bankAccountNumber ?? ""}
                                onChange={(e) =>
                                    setForm({ ...form, bankAccountNumber: e.target.value })
                                }
                                placeholder="0102030405"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Nama Pemilik Rekening (Atas Nama)">
                            <input
                                value={form.bankAccountHolder ?? ""}
                                onChange={(e) =>
                                    setForm({ ...form, bankAccountHolder: e.target.value })
                                }
                                placeholder="Kelompok Tani Makmur"
                                className={inputClass}
                            />
                        </Field>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <h4 className="text-sm font-extrabold text-slate-800">Dompet Digital (Opsional)</h4>
                        <p className="mt-1 text-xs font-medium text-slate-500 leading-relaxed max-w-3xl">
                            Alternatif tujuan pencairan dana selain rekening bank. Di Indonesia satu nomor HP
                            biasanya dipakai untuk beberapa aplikasi sekaligus — centang yang aktif.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {DAFTAR_EWALLET.map((w) => {
                                const aktif = form.ewalletProviders?.includes(w.value) ?? false;
                                return (
                                    <button
                                        key={w.value}
                                        type="button"
                                        onClick={() =>
                                            setForm({
                                                ...form,
                                                ewalletProviders: aktif
                                                    ? (form.ewalletProviders ?? []).filter((p) => p !== w.value)
                                                    : [...(form.ewalletProviders ?? []), w.value],
                                            })
                                        }
                                        className={`rounded-xl border px-4 py-2 text-xs font-bold transition ${aktif
                                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                            }`}
                                    >
                                        {w.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-5 grid gap-5 sm:grid-cols-2">
                            <Field label="Nomor HP Dompet Digital">
                                <input
                                    value={form.ewalletNumber ?? ""}
                                    onChange={(e) => setForm({ ...form, ewalletNumber: e.target.value })}
                                    placeholder="08xxxxxxxxxx"
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Nama Pemilik">
                                <input
                                    value={form.ewalletHolder ?? ""}
                                    onChange={(e) => setForm({ ...form, ewalletHolder: e.target.value })}
                                    placeholder="Nama sesuai akun dompet digital"
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                    </div>

                    <div className="mt-8 flex pt-6 border-t border-slate-100">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-2xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
                        >
                            {saving ? "Menyimpan..." : "Simpan Rekening Pemasok"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function PasswordCard({
    onDone,
    onError,
}: {
    onDone: (msg: string) => void;
    onError: (msg: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [saving, setSaving] = useState(false);

    async function submit() {
        if (next !== confirm) {
            onError("Konfirmasi password baru tidak cocok.");
            return;
        }
        setSaving(true);
        try {
            await changePassword(current, next);
            setCurrent("");
            setNext("");
            setConfirm("");
            setOpen(false);
            onDone("Password berhasil diubah dengan aman");
        } catch (err) {
            onError(getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
                <ShieldCheck size={15} /> Keamanan Akun
            </div>
            <h3 className="font-display text-lg font-extrabold text-slate-900">Ubah Kata Sandi</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">Amankan akun Anda dengan kata sandi yang kuat.</p>

            <button
                onClick={() => setOpen(!open)}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
                <KeyRound size={16} /> {open ? "Tutup Formulir" : "Ubah Kata Sandi"}
            </button>

            {open && (
                <div className="mt-6 space-y-4 pt-4 border-t border-slate-100">
                    <Field label="Kata Sandi Saat Ini">
                        <input
                            type="password"
                            value={current}
                            onChange={(e) => setCurrent(e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Kata Sandi Baru">
                        <input
                            type="password"
                            value={next}
                            onChange={(e) => setNext(e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Ulangi Kata Sandi Baru">
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className={inputClass}
                        />
                    </Field>

                    <div className="pt-2">
                        <button
                            onClick={submit}
                            disabled={saving || !current || !next}
                            className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50"
                        >
                            {saving ? "Menyimpan Sandi..." : "Simpan Kata Sandi Baru"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500";

function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">{label}</span>
            {children}
            {hint && <span className="mt-1.5 block text-[11px] font-medium text-slate-400">{hint}</span>}
        </label>
    );
}