"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowRight, Store, Sprout } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { AuthResponse } from "@/types/auth";

const loginSchema = z.object({
    email: z.string().min(1, "Email wajib diisi").email("Format email gak valid"),
    password: z.string().min(1, "Password wajib diisi"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [serverError, setServerError] = useState<string | null>(null);
    const [perluVerifikasi, setPerluVerifikasi] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

    async function onSubmit(data: LoginForm) {
        setServerError(null);
        setPerluVerifikasi(false);
        setLoading(true);

        try {
            const res = await api.post<AuthResponse>("/auth/login", data);
            setAuth(res.data.user, res.data.token);
            router.push("/dashboard");
        } catch (err) {
            const pesan = getApiErrorMessage(err);
            setServerError(pesan);

            // Akun yang belum diverifikasi butuh jalan keluar, bukan
            // sekadar pesan galat — arahkan ke halaman kirim ulang
            if (pesan.toLowerCase().includes("verifikasi")) {
                setPerluVerifikasi(true);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Masuk ke akun kamu"
            subtitle="Kelola bahan baku dan pesanan dalam satu tempat."
            backgroundImage="/images/umkmlogin.png"
            peran="umkm"
            mode="ilustrasi"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                <TextField
                    label="Email"
                    type="email"
                    placeholder="nama@usaha.com"
                    autoComplete="email"
                    error={errors.email?.message}
                    {...register("email")}
                />

                <TextField
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    error={errors.password?.message}
                    {...register("password")}
                />

                {serverError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 shadow-sm">
                        <p className="flex items-start gap-2 text-sm text-red-700">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            {serverError}
                        </p>

                        {perluVerifikasi && (
                            <Link
                                href="/verifikasi"
                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-200"
                            >
                                Kirim ulang tautan verifikasi
                                <ArrowRight size={12} />
                            </Link>
                        )}
                    </div>
                )}

                {/* Tombol masuk dibuat rounded-full ala kapsul */}
                <Button
                    type="submit"
                    loading={loading}
                    className="mt-2 w-full rounded-full py-3.5 text-[15px] font-semibold shadow-sm transition-all hover:shadow-md"
                >
                    Masuk
                </Button>
            </form>

            {/* Pemisah sebelum ajakan mendaftar */}
            <div className="mt-10 flex items-center gap-3 opacity-80">
                <span className="h-px flex-1 bg-ink/10" />
                <span className="text-xs font-medium uppercase tracking-wider text-ink-soft">Belum punya akun?</span>
                <span className="h-px flex-1 bg-ink/10" />
            </div>

            {/* Desain Card Modern untuk pilihan daftar */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                    href="/register?role=umkm"
                    className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-white p-4 text-left transition-all duration-300 hover:border-brand-blue hover:bg-blue-50/30 hover:shadow-sm"
                >
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
                        <Store size={20} strokeWidth={1.5} />
                    </span>

                    <div className="text-sm font-bold tracking-tight text-soil">
                        UMKM Kuliner
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs font-medium text-brand-blue">
                        Daftar
                        <ArrowRight
                            size={12}
                            className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                    </div>
                </Link>

                <Link
                    href="/register?role=supplier"
                    className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-white p-4 text-left transition-all duration-300 hover:border-leaf hover:bg-leaf-soft/30 hover:shadow-sm"
                >
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-soft text-leaf-dark transition-colors group-hover:bg-leaf group-hover:text-white">
                        <Sprout size={20} strokeWidth={1.5} />
                    </span>

                    <div className="text-sm font-bold tracking-tight text-soil">
                        Kelompok Tani
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs font-medium text-leaf-dark">
                        Daftar
                        <ArrowRight
                            size={12}
                            className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                    </div>
                </Link>
            </div>

            <p className="mt-8 text-center text-[13px] text-ink-soft">
                Butuh bantuan?{" "}
                <Link href="/bantuan" className="font-semibold text-leaf-dark transition-colors hover:underline">
                    Buka pusat bantuan
                </Link>
            </p>
        </AuthLayout>
    );
}