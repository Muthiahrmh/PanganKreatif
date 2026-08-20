"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Trash2, Check, KeyRound } from "lucide-react";
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
import type { ProfilePayload } from "@/types/auth";

const emptyForm: ProfilePayload = {
    name: "",
    phone: "",
    businessName: "",
    businessType: "",
    groupName: "",
    city: "",
    address: "",
};

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
            // Kirim hanya field yang relevan dengan role
            const payload: ProfilePayload = {
                name: form.name,
                phone: form.phone || null,
            };
            if (!isAdmin) {
                payload.city = form.city;
                payload.address = form.address;
                if (isSupplier) {
                    payload.groupName = form.groupName;
                } else {
                    payload.businessName = form.businessName;
                    payload.businessType = form.businessType;
                }
            }

            const updated = await updateProfile(payload);
            updateUser(updated);
            flash("Profil berhasil disimpan");
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
            flash("Foto profil diperbarui");
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    async function handleDeletePhoto() {
        if (!window.confirm("Hapus foto profil?")) return;
        setUploading(true);
        try {
            const updated = await deleteAvatar();
            updateUser(updated);
            flash("Foto profil dihapus");
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setUploading(false);
        }
    }

    if (!user) return null;

    const initial = (user.name ?? "U").charAt(0).toUpperCase();

    return (
        <div className="flex flex-col gap-5">
            {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
            {success && (
                <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                    <Check size={15} /> {success}
                </p>
            )}

            <div className="grid items-start gap-5 lg:grid-cols-[320px_1fr]">
                {/* Kolom kiri: foto profil + keamanan */}
                <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-ink/5 bg-white p-6">
                <h3 className="font-display text-base font-bold text-ink">Foto Profil</h3>

                <div className="mt-4 flex flex-col items-center gap-4 text-center">
                    <div className="relative">
                        {user.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={user.avatarUrl}
                                alt="Foto profil"
                                className="h-32 w-32 rounded-full object-cover ring-2 ring-ink/5"
                            />
                        ) : (
                            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-brand-blue font-display text-4xl font-bold text-white">
                                {initial}
                            </div>
                        )}

                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/40">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            </div>
                        )}
                    </div>

                    <div className="w-full">
                        <div className="flex flex-wrap justify-center gap-2">
                            <button
                                onClick={() => fileRef.current?.click()}
                                disabled={uploading}
                                className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                            >
                                <Camera size={15} />
                                {user.avatarUrl ? "Ganti foto" : "Unggah foto"}
                            </button>

                            {user.avatarUrl && (
                                <button
                                    onClick={handleDeletePhoto}
                                    disabled={uploading}
                                    className="inline-flex items-center gap-2 rounded-lg border border-ink/10 px-4 py-2 text-sm font-medium text-ink transition hover:bg-paper-soft disabled:opacity-60"
                                >
                                    <Trash2 size={15} /> Hapus
                                </button>
                            )}
                        </div>

                        <p className="mt-2 text-xs text-ink-soft">
                            Format JPG, PNG, atau WEBP. Ukuran maksimal 2 MB.
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

                {/* Kolom kanan: data usaha */}
            <div className="rounded-xl border border-ink/5 bg-white p-6">
                <h3 className="font-display text-base font-bold text-ink">
                    {isAdmin ? "Data Akun" : "Data Usaha"}
                </h3>

                {loading ? (
                    <div className="mt-4 space-y-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <Field label="Nama lengkap">
                                <input
                                    value={form.name ?? ""}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Email" hint="Email tidak bisa diubah">
                                <input
                                    value={user.email}
                                    disabled
                                    className={`${inputClass} cursor-not-allowed bg-paper-soft text-ink-soft`}
                                />
                            </Field>

                            <Field label="No. HP">
                                <input
                                    value={form.phone ?? ""}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    placeholder="08xxxxxxxxxx"
                                    className={inputClass}
                                />
                            </Field>

                            {!isAdmin && (
                                <>
                                    <Field label={isSupplier ? "Nama kelompok / distributor" : "Nama usaha"}>
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
                                        <Field label="Jenis usaha">
                                            <input
                                                value={form.businessType ?? ""}
                                                onChange={(e) =>
                                                    setForm({ ...form, businessType: e.target.value })
                                                }
                                                placeholder="Katering, Warung, Kafe"
                                                className={inputClass}
                                            />
                                        </Field>
                                    )}

                                    <Field label="Kota">
                                        <input
                                            value={form.city ?? ""}
                                            onChange={(e) => setForm({ ...form, city: e.target.value })}
                                            className={inputClass}
                                        />
                                    </Field>

                                    <div className="sm:col-span-2">
                                        <Field label="Alamat">
                                            <textarea
                                                value={form.address ?? ""}
                                                onChange={(e) =>
                                                    setForm({ ...form, address: e.target.value })
                                                }
                                                rows={2}
                                                className={inputClass}
                                            />
                                        </Field>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-5 flex items-center gap-3">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="rounded-lg bg-brand-green px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-green-dark disabled:opacity-60"
                            >
                                {saving ? "Menyimpan..." : "Simpan perubahan"}
                            </button>

                            {user.createdAt && (
                                <span className="text-xs text-ink-soft">
                                    Bergabung {formatDate(user.createdAt)}
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>

            </div>
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
            onError("Konfirmasi password tidak cocok");
            return;
        }
        setSaving(true);
        try {
            await changePassword(current, next);
            setCurrent("");
            setNext("");
            setConfirm("");
            setOpen(false);
            onDone("Password berhasil diubah");
        } catch (err) {
            onError(getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="rounded-xl border border-ink/5 bg-white p-6">
            <div>
                <h3 className="font-display text-base font-bold text-ink">Keamanan</h3>
                <p className="mt-1 text-sm text-ink-soft">Ubah password akun kamu.</p>

                <button
                    onClick={() => setOpen(!open)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ink/10 px-4 py-2 text-sm font-medium text-ink transition hover:bg-paper-soft"
                >
                    <KeyRound size={15} /> {open ? "Tutup" : "Ubah password"}
                </button>
            </div>

            {open && (
                <div className="mt-5 grid gap-4">
                    <Field label="Password saat ini">
                        <input
                            type="password"
                            value={current}
                            onChange={(e) => setCurrent(e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Password baru">
                        <input
                            type="password"
                            value={next}
                            onChange={(e) => setNext(e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Ulangi password baru">
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className={inputClass}
                        />
                    </Field>

                    <div>
                        <button
                            onClick={submit}
                            disabled={saving || !current || !next}
                            className="rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                        >
                            {saving ? "Menyimpan..." : "Simpan password"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const inputClass =
    "w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20";

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
            <span className="mb-1.5 block text-xs font-medium text-ink-soft">{label}</span>
            {children}
            {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
        </label>
    );
}