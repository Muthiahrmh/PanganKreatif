"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, Truck, MailCheck, RefreshCw } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { api, getApiErrorMessage } from "@/lib/api";
import { kirimUlangVerifikasi } from "@/lib/verifikasi";
import type { Role } from "@/types/auth";

const registerSchema = z
    .object({
        name: z.string().min(2, "Nama minimal 2 karakter"),
        email: z.string().min(1, "Email wajib diisi").email("Format email gak valid"),
        password: z.string().min(6, "Password minimal 6 karakter"),
        phone: z.string().optional(),
        city: z.string().min(1, "Kota wajib diisi"),
        address: z.string().min(1, "Alamat wajib diisi"),
        businessName: z.string().optional(),
        businessType: z.string().optional(),
        groupName: z.string().optional(),
    })
    .partial({ businessName: true, businessType: true, groupName: true });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterForm() {
    const searchParams = useSearchParams();
    const initialRole = searchParams.get("role") === "supplier" ? "supplier" : "umkm";

    const [role, setRole] = useState<Extract<Role, "umkm" | "supplier">>(initialRole);
    const [serverError, setServerError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Setelah pendaftaran berhasil, formulir diganti pesan cek email.
    // Akun sudah dibuat tapi belum bisa dipakai sebelum diverifikasi.
    const [terdaftar, setTerdaftar] = useState<{
        email: string;
        pesan: string;
        emailTerkirim: boolean;
        berlakuMenit: number;
    } | null>(null);
    const [mengirimUlang, setMengirimUlang] = useState(false);
    const [pesanUlang, setPesanUlang] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

    async function onSubmit(data: RegisterForm) {
        setServerError(null);

        if (role === "umkm" && !data.businessName) {
            setServerError("Nama usaha wajib diisi");
            return;
        }
        if (role === "supplier" && !data.groupName) {
            setServerError("Nama kelompok tani/distributor wajib diisi");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...data,
                role,
                businessType: role === "umkm" ? data.businessType || "umum" : undefined,
            };
            const res = await api.post<{
                email: string;
                pesan: string;
                emailTerkirim: boolean;
                berlakuMenit: number;
            }>("/auth/register", payload);

            // Tidak langsung masuk — email harus diverifikasi dulu
            setTerdaftar({
                email: res.data.email ?? data.email,
                pesan: res.data.pesan,
                emailTerkirim: Boolean(res.data.emailTerkirim),
                berlakuMenit: res.data.berlakuMenit ?? 5,
            });
        } catch (err) {
            setServerError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    async function kirimUlang() {
        if (!terdaftar) return;

        setMengirimUlang(true);
        setPesanUlang(null);
        try {
            const hasil = await kirimUlangVerifikasi(terdaftar.email);
            setPesanUlang(hasil.pesan);
        } catch (err) {
            setPesanUlang(getApiErrorMessage(err));
        } finally {
            setMengirimUlang(false);
        }
    }

    // ---------- Setelah pendaftaran berhasil ----------
    if (terdaftar) {
        return (
            <AuthLayout
                title="Cek email kamu"
                subtitle="Satu langkah lagi sebelum akunmu bisa dipakai."
                backgroundImage={
                    role === "umkm"
                        ? "/images/walpaper_regis_umkm.png"
                        : "/images/walpaper_regis_supplier.png"
                }
            >
                <div className="flex flex-col items-center text-center">
                    <span
                        className={`flex h-14 w-14 items-center justify-center rounded-full ${terdaftar.emailTerkirim
                                ? "bg-blue-50 text-brand-blue"
                                : "bg-amber-50 text-amber-600"
                            }`}
                    >
                        <MailCheck size={26} />
                    </span>

                    <h2 className="mt-4 font-display text-lg font-bold text-ink">
                        {terdaftar.emailTerkirim
                            ? "Tautan verifikasi terkirim"
                            : "Akun dibuat, email belum terkirim"}
                    </h2>

                    <p className="mt-2 text-sm text-ink-soft">
                        {terdaftar.emailTerkirim ? (
                            <>
                                Kami mengirim tautan ke{" "}
                                <span className="font-semibold text-ink">{terdaftar.email}</span>.
                                Buka emailnya lalu klik tautan itu untuk mengaktifkan akun.
                            </>
                        ) : (
                            terdaftar.pesan
                        )}
                    </p>

                    {terdaftar.emailTerkirim && (
                        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                            Tautan hanya berlaku {terdaftar.berlakuMenit} menit. Kalau lewat,
                            tekan tombol di bawah untuk meminta tautan baru.
                        </p>
                    )}

                    <p className="mt-2 text-xs text-ink-soft">
                        Tidak ada di kotak masuk? Periksa folder Spam atau Promosi.
                    </p>

                    {pesanUlang && (
                        <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-brand-blue">
                            {pesanUlang}
                        </p>
                    )}

                    <button
                        onClick={kirimUlang}
                        disabled={mengirimUlang}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-ink/10 px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-paper-soft disabled:opacity-60"
                    >
                        <RefreshCw size={14} className={mengirimUlang ? "animate-spin" : ""} />
                        {mengirimUlang ? "Mengirim..." : "Kirim ulang tautan"}
                    </button>

                    <p className="mt-6 text-sm text-ink-soft">
                        Sudah verifikasi?{" "}
                        <Link
                            href="/login"
                            className="font-semibold text-brand-blue hover:underline"
                        >
                            Masuk di sini
                        </Link>
                    </p>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Buat akun baru"
            subtitle="Gabung ke ekosistem rantai pasok bahan baku kuliner berbasis AI."
            backgroundImage={role === "umkm" ? "/images/walpaper_regis_umkm.png" : "/images/walpaper_regis_supplier.png"}
        >
            {/* Role tabs */}
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-paper-soft p-1">
                <button
                    type="button"
                    onClick={() => setRole("umkm")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${role === "umkm" ? "bg-white text-brand-blue shadow-sm" : "text-ink-soft"
                        }`}
                >
                    <Store size={15} /> UMKM Kuliner
                </button>
                <button
                    type="button"
                    onClick={() => setRole("supplier")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${role === "supplier" ? "bg-white text-brand-green shadow-sm" : "text-ink-soft"
                        }`}
                >
                    <Truck size={15} /> Kelompok Tani
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <TextField label="Nama lengkap" placeholder="Nama kamu" error={errors.name?.message} {...register("name")} />
                <TextField
                    label="Email"
                    type="email"
                    placeholder="nama@usaha.com"
                    error={errors.email?.message}
                    {...register("email")}
                />
                <TextField
                    label="Password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    error={errors.password?.message}
                    {...register("password")}
                />
                <TextField label="No. HP (opsional)" placeholder="08xxxxxxxxxx" {...register("phone")} />

                {role === "umkm" ? (
                    <>
                        <TextField
                            label="Nama usaha"
                            placeholder="Warung / Kafe / Katering"
                            error={errors.businessName?.message}
                            {...register("businessName")}
                        />
                        <TextField
                            label="Jenis usaha"
                            placeholder="Warung, kafe, katering, dll"
                            {...register("businessType")}
                        />
                    </>
                ) : (
                    <TextField
                        label="Nama kelompok tani / distributor"
                        placeholder="Nama kelompok atau usaha distribusi"
                        error={errors.groupName?.message}
                        {...register("groupName")}
                    />
                )}

                <TextField label="Kota" placeholder="Lhokseumawe" error={errors.city?.message} {...register("city")} />
                <TextField
                    label="Alamat"
                    placeholder="Jl. ..."
                    error={errors.address?.message}
                    {...register("address")}
                />

                {serverError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
                )}

                <Button type="submit" loading={loading} className="mt-2 w-full">
                    Daftar sebagai {role === "umkm" ? "UMKM Kuliner" : "Kelompok Tani"}
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-soft">
                Udah punya akun?{" "}
                <Link href="/login" className="font-semibold text-brand-blue hover:underline">
                    Masuk
                </Link>
            </p>
        </AuthLayout>
    );
}