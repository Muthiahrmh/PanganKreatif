"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Store,
    Sprout,
    MailCheck,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
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
            setServerError("Nama kelompok tani atau distributor wajib diisi");
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

    const umkm = role === "umkm";
    const gambar = umkm
        ? "/images/umkmlogin.png"
        : "/images/walpaper_regis_supplier.png";

    if (terdaftar) {
        return (
            <AuthLayout
                title="Cek email kamu"
                subtitle="Satu langkah lagi sebelum akunmu bisa dipakai."
                backgroundImage={gambar}
                peran={umkm ? "umkm" : "tani"}
                mode="ilustrasi"
            >
                <div className="flex flex-col items-center text-center">
                    <span
                        className={`flex h-20 w-20 items-center justify-center rounded-full shadow-sm ${!terdaftar.emailTerkirim
                            ? "bg-harvest-soft text-harvest"
                            : umkm
                                ? "bg-blue-50 text-brand-blue"
                                : "bg-leaf-soft text-leaf-dark"
                            }`}
                    >
                        <MailCheck size={36} strokeWidth={1.5} />
                    </span>
                    <h2 className="mt-6 font-display text-xl font-bold text-soil">
                        {terdaftar.emailTerkirim
                            ? "Tautan verifikasi terkirim"
                            : "Akun dibuat, email belum terkirim"}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                        {terdaftar.emailTerkirim ? (
                            <>
                                Kami mengirim tautan ke <span className="font-semibold text-soil">{terdaftar.email}</span>. Buka emailnya lalu klik tautan itu untuk mengaktifkan akun.
                            </>
                        ) : (
                            terdaftar.pesan
                        )}
                    </p>
                    {terdaftar.emailTerkirim && (
                        <p className="mt-6 w-full rounded-2xl border border-harvest/20 bg-harvest-soft px-5 py-4 text-sm leading-relaxed text-harvest">
                            Tautan hanya berlaku <b>{terdaftar.berlakuMenit} menit</b>. Kalau lewat, tekan tombol di bawah untuk meminta tautan baru.
                        </p>
                    )}
                    <button
                        onClick={kirimUlang}
                        disabled={mengirimUlang}
                        className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink/10 px-6 py-3 text-sm font-medium text-soil transition-all hover:bg-gray-50 hover:shadow-sm disabled:opacity-60"
                    >
                        <RefreshCw size={16} className={mengirimUlang ? "animate-spin" : ""} />
                        {mengirimUlang ? "Mengirim..." : "Kirim ulang tautan"}
                    </button>
                    <p className="mt-8 text-sm text-ink-soft">
                        Sudah verifikasi? <Link href="/login" className={`font-semibold transition-colors hover:underline ${umkm ? "text-brand-blue" : "text-leaf-dark"}`}>Masuk di sini</Link>
                    </p>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Buat akun baru"
            subtitle="Gabung ke ekosistem rantai pasok bahan baku kuliner berbasis AI."
            backgroundImage={gambar}
            peran={umkm ? "umkm" : "tani"}
            mode="ilustrasi"
        >
            {/* Pilihan Role bergaya Card modern ala landing page */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => setRole("umkm")}
                    className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${role === "umkm"
                            ? "border-brand-blue bg-blue-50/50 shadow-sm ring-1 ring-brand-blue"
                            : "border-ink/10 bg-white hover:border-ink/30 hover:shadow-sm hover:bg-gray-50"
                        }`}
                >
                    <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${role === "umkm" ? "bg-brand-blue text-white" : "bg-gray-100 text-ink-soft group-hover:bg-gray-200"}`}>
                        <Store size={20} strokeWidth={1.5} />
                    </span>
                    <div className={`text-base font-bold tracking-tight ${role === "umkm" ? "text-brand-blue" : "text-soil"}`}>UMKM Kuliner</div>
                    <div className="mt-1 text-xs leading-relaxed text-ink-soft">Warung, kafe, katering</div>
                </button>

                <button
                    type="button"
                    onClick={() => setRole("supplier")}
                    className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${role === "supplier"
                            ? "border-leaf bg-leaf-soft/50 shadow-sm ring-1 ring-leaf"
                            : "border-ink/10 bg-white hover:border-ink/30 hover:shadow-sm hover:bg-gray-50"
                        }`}
                >
                    <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${role === "supplier" ? "bg-leaf text-white" : "bg-gray-100 text-ink-soft group-hover:bg-gray-200"}`}>
                        <Sprout size={20} strokeWidth={1.5} />
                    </span>
                    <div className={`text-base font-bold tracking-tight ${role === "supplier" ? "text-leaf-dark" : "text-soil"}`}>Kelompok Tani</div>
                    <div className="mt-1 text-xs leading-relaxed text-ink-soft">Petani, nelayan, distributor</div>
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-6">

                {/* Data Akun */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-ink-soft/70">Data Akun Pribadi</div>
                        <div className="h-px flex-1 bg-ink/5"></div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <TextField label="Nama lengkap" placeholder="Nama kamu" error={errors.name?.message} {...register("name")} />
                        <TextField label="Email" type="email" placeholder="nama@usaha.com" error={errors.email?.message} {...register("email")} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <TextField label="Password" type="password" placeholder="Minimal 6 karakter" error={errors.password?.message} {...register("password")} />
                        <TextField label="No. HP (opsional)" placeholder="08xxxxxxxxxx" {...register("phone")} />
                    </div>
                </div>

                {/* Data Usaha / Kelompok */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-ink-soft/70">
                            {role === "umkm" ? "Informasi Usaha" : "Informasi Kelompok"}
                        </div>
                        <div className="h-px flex-1 bg-ink/5"></div>
                    </div>

                    {role === "umkm" ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <TextField label="Nama usaha" placeholder="Cth: Warung Makmur" error={errors.businessName?.message} {...register("businessName")} />
                            <TextField label="Jenis usaha" placeholder="Cth: Kafe, Katering" {...register("businessType")} />
                        </div>
                    ) : (
                        <TextField label="Nama kelompok tani / distributor" placeholder="Cth: Kelompok Tani Jaya" error={errors.groupName?.message} {...register("groupName")} />
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <TextField label="Kota" placeholder="Cth: Lhokseumawe" error={errors.city?.message} {...register("city")} />
                        <TextField label="Alamat Lengkap" placeholder="Jl. ..." error={errors.address?.message} {...register("address")} />
                    </div>
                </div>

                {serverError && (
                    <p className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        {serverError}
                    </p>
                )}

                {/* Tombol submit dibuat rounded-full (kapsul) seperti di landing page */}
                <Button
                    type="submit"
                    loading={loading}
                    variant={umkm ? "primary" : "tani"}
                    className="mt-4 w-full rounded-full py-3.5 text-[15px] font-semibold shadow-sm transition-all hover:shadow-md"
                >
                    Daftar sebagai {umkm ? "UMKM Kuliner" : "Kelompok Tani"}
                </Button>

                <p className="text-center text-xs leading-relaxed text-ink-soft/80">
                    Kami akan mengirim tautan verifikasi ke emailmu sebelum akun bisa dipakai.
                </p>
            </form>

            <p className="mt-8 text-center text-[15px] text-ink-soft">
                Sudah punya akun?{" "}
                <Link href="/login" className={`font-bold transition-colors hover:underline ${umkm ? "text-brand-blue" : "text-leaf-dark"}`}>
                    Masuk
                </Link>
            </p>
        </AuthLayout>
    );
}