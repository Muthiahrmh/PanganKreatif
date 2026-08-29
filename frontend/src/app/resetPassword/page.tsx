"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { api, getApiErrorMessage } from "@/lib/api";

function IsiResetPassword() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const email = searchParams.get("email") || "";

    const [password, setPassword] = useState("");
    const [konfirmasi, setKonfirmasi] = useState("");
    const [loading, setLoading] = useState(false);
    const [sukses, setSukses] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (password !== konfirmasi) {
            setError("Konfirmasi kata sandi tidak cocok.");
            return;
        }

        setLoading(true);

        try {
            await api.post("/auth/resetPassword", {
                token,
                email,
                password,
            });
            setSukses(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    if (!token || !email) {
        return (
            <div className="py-8 text-center">
                <p className="text-sm text-red-600 font-bold">Tautan reset kata sandi tidak valid atau tidak lengkap.</p>
                <Link href="/login" className="mt-4 inline-block text-xs font-bold text-blue-600 hover:underline">
                    Kembali ke Masuk
                </Link>
            </div>
        );
    }

    return (
        <AuthLayout title="Atur Kata Sandi Baru" subtitle="Masukkan kata sandi baru untuk akun Anda.">
            {sukses ? (
                <div className="flex flex-col items-center py-6 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
                        <CheckCircle2 size={36} className="text-emerald-600" />
                    </span>
                    <h3 className="font-display text-lg font-bold text-slate-900">Berhasil Diubah!</h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">
                        Kata sandi Anda telah diperbarui. Mengalihkan ke halaman masuk...
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2">
                            <AlertCircle size={18} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <TextField
                        label="Kata Sandi Baru"
                        type="password"
                        placeholder="Min. 6 karakter"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <TextField
                        label="Konfirmasi Kata Sandi Baru"
                        type="password"
                        placeholder="Ulangi kata sandi baru"
                        value={konfirmasi}
                        onChange={(e) => setKonfirmasi(e.target.value)}
                        required
                    />

                    <Button type="submit" loading={loading} className="w-full rounded-2xl py-3.5 text-sm font-bold shadow-md">
                        Simpan Kata Sandi Baru
                    </Button>
                </form>
            )}
        </AuthLayout>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
            <IsiResetPassword />
        </Suspense>
    );
}