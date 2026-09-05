"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowRight, Store, Sprout, ShieldCheck, RefreshCw } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { AuthResponse, LoginOtpResponse } from "@/types/auth";

const loginSchema = z.object({
    email: z.string().min(1, "Email wajib diisi").email("Format email gak valid"),
    password: z.string().min(1, "Password wajib diisi"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);
    const deviceToken = useAuthStore((s) => s.deviceToken);
    const setDeviceToken = useAuthStore((s) => s.setDeviceToken);

    const [serverError, setServerError] = useState<string | null>(null);
    const [perluVerifikasi, setPerluVerifikasi] = useState(false);
    const [loading, setLoading] = useState(false);

    // Lapis kedua: kalau backend minta OTP, form password disembunyikan
    // dan diganti form kode, tanpa pindah halaman.
    const [emailOtp, setEmailOtp] = useState<string | null>(null);
    const [kodeOtp, setKodeOtp] = useState("");
    const [otpError, setOtpError] = useState<string | null>(null);
    const [otpLoading, setOtpLoading] = useState(false);
    const [mengirimUlang, setMengirimUlang] = useState(false);
    const [jedaKirimUlang, setJedaKirimUlang] = useState(0);
    const [ingatPerangkat, setIngatPerangkat] = useState(true);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

    useEffect(() => {
        if (jedaKirimUlang <= 0) return;
        const t = window.setInterval(() => setJedaKirimUlang((s) => Math.max(0, s - 1)), 1000);
        return () => window.clearInterval(t);
    }, [jedaKirimUlang]);

    async function onSubmit(data: LoginForm) {
        setServerError(null);
        setPerluVerifikasi(false);
        setLoading(true);

        try {
            const res = await api.post<AuthResponse | LoginOtpResponse>("/auth/login", {
                ...data,
                // Kalau perangkat ini pernah lolos OTP sebelumnya, sertakan
                // tokennya — backend akan lewati OTP kalau masih berlaku.
                ...(deviceToken && { deviceToken }),
            });

            if ("perluOtp" in res.data && res.data.perluOtp) {
                setEmailOtp(res.data.email);
                setJedaKirimUlang(60);
                return;
            }

            const hasil = res.data as AuthResponse;
            setAuth(hasil.user, hasil.token);
            router.push("/dashboard");
        } catch (err) {
            const pesan = getApiErrorMessage(err);
            setServerError(pesan);

            if (pesan.toLowerCase().includes("verifikasi")) {
                setPerluVerifikasi(true);
            }
        } finally {
            setLoading(false);
        }
    }

    async function submitOtp() {
        if (!emailOtp || kodeOtp.length !== 6) return;
        setOtpError(null);
        setOtpLoading(true);
        try {
            const res = await api.post<AuthResponse>("/auth/login/verify-otp", {
                email: emailOtp,
                kode: kodeOtp,
                ingatPerangkat,
            });
            setAuth(res.data.user, res.data.token);
            // Simpan token "ingat perangkat ini" — login berikutnya dari
            // perangkat yang sama tidak perlu OTP lagi.
            if (res.data.deviceToken) setDeviceToken(res.data.deviceToken);
            router.push("/dashboard");
        } catch (err) {
            setOtpError(getApiErrorMessage(err));
            setKodeOtp("");
        } finally {
            setOtpLoading(false);
        }
    }

    async function kirimUlangOtp() {
        if (!emailOtp || jedaKirimUlang > 0) return;
        setMengirimUlang(true);
        setOtpError(null);
        try {
            await api.post("/auth/login/otp/resend", { email: emailOtp });
            setJedaKirimUlang(60);
        } catch (err) {
            setOtpError(getApiErrorMessage(err));
        } finally {
            setMengirimUlang(false);
        }
    }

    if (emailOtp) {
        return (
            <AuthLayout
                title="Verifikasi Kode Login"
                subtitle="Satu langkah lagi — kode verifikasi sudah dikirim ke emailmu."
                backgroundImage="/images/umkmlogin.png"
                peran="umkm"
                mode="ilustrasi"
            >
                <div className="flex flex-col items-center text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
                        <ShieldCheck size={30} strokeWidth={1.5} />
                    </span>
                    <p className="mt-5 text-sm leading-relaxed text-ink-soft">
                        Masukkan kode 6 digit yang dikirim ke{" "}
                        <span className="font-semibold text-soil">{emailOtp}</span>.
                    </p>

                    <input
                        value={kodeOtp}
                        onChange={(e) =>
                            setKodeOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter") submitOtp();
                        }}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        className="mt-6 w-full max-w-[240px] rounded-2xl border border-ink/15 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-brand-blue"
                    />

                    {otpError && (
                        <p className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <AlertCircle size={16} className="shrink-0" />
                            {otpError}
                        </p>
                    )}

                    <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-left">
                        <input
                            type="checkbox"
                            checked={ingatPerangkat}
                            onChange={(e) => setIngatPerangkat(e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink/25 text-brand-blue focus:ring-brand-blue"
                        />
                        <span className="text-sm text-ink-soft">
                            Ingat perangkat ini selama 30 hari — login berikutnya di{" "}
                            <span className="font-semibold">HP/laptop ini</span> tidak perlu kode OTP lagi.
                        </span>
                    </label>

                    <Button
                        onClick={submitOtp}
                        loading={otpLoading}
                        disabled={kodeOtp.length !== 6}
                        className="mt-6 w-full rounded-full py-3.5 text-[15px] font-semibold shadow-sm transition-all hover:shadow-md"
                    >
                        Verifikasi & Masuk
                    </Button>

                    <button
                        onClick={kirimUlangOtp}
                        disabled={jedaKirimUlang > 0 || mengirimUlang}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue transition hover:underline disabled:cursor-not-allowed disabled:text-ink-soft disabled:no-underline"
                    >
                        <RefreshCw size={14} className={mengirimUlang ? "animate-spin" : ""} />
                        {jedaKirimUlang > 0
                            ? `Kirim ulang kode (${jedaKirimUlang}s)`
                            : "Kirim ulang kode"}
                    </button>

                    <button
                        onClick={() => {
                            setEmailOtp(null);
                            setKodeOtp("");
                            setOtpError(null);
                        }}
                        className="mt-3 text-xs font-medium text-ink-soft hover:underline"
                    >
                        Kembali ke halaman masuk
                    </button>
                </div>
            </AuthLayout>
        );
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

                <div>
                    <TextField
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        error={errors.password?.message}
                        {...register("password")}
                    />
                    <div className="mt-1.5 flex justify-end">
                        <Link
                            href="/lupaPassword"
                            className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                            Lupa kata sandi?
                        </Link>
                    </div>
                </div>

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

                <Button
                    type="submit"
                    loading={loading}
                    className="mt-2 w-full rounded-full py-3.5 text-[15px] font-semibold shadow-sm transition-all hover:shadow-md"
                >
                    Masuk
                </Button>
            </form>

            <div className="mt-10 flex items-center gap-3 opacity-80">
                <span className="h-px flex-1 bg-ink/10" />
                <span className="text-xs font-medium uppercase tracking-wider text-ink-soft">Belum punya akun?</span>
                <span className="h-px flex-1 bg-ink/10" />
            </div>

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