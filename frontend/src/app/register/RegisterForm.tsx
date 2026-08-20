"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, Truck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { AuthResponse, Role } from "@/types/auth";

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
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialRole = searchParams.get("role") === "supplier" ? "supplier" : "umkm";

    const [role, setRole] = useState<Extract<Role, "umkm" | "supplier">>(initialRole);
    const [serverError, setServerError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const setAuth = useAuthStore((s) => s.setAuth);

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
            const res = await api.post<AuthResponse>("/auth/register", payload);
            setAuth(res.data.user, res.data.token);
            router.push("/dashboard");
        } catch (err) {
            setServerError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
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
