"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

    async function onSubmit(data: LoginForm) {
        setServerError(null);
        setLoading(true);
        try {
            const res = await api.post<AuthResponse>("/auth/login", data);
            setAuth(res.data.user, res.data.token);
            router.push("/dashboard");
        } catch (err) {
            setServerError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout title="Masuk ke akun kamu" subtitle="Kelola bahan baku dan pesanan dalam satu tempat.">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
                    placeholder="••••••••"
                    error={errors.password?.message}
                    {...register("password")}
                />

                {serverError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
                )}

                <Button type="submit" loading={loading} className="mt-2 w-full">
                    Masuk
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-soft">
                Belum punya akun?{" "}
                <Link href="/register" className="font-semibold text-brand-blue hover:underline">
                    Daftar sekarang
                </Link>
            </p>
        </AuthLayout>
    );
}
