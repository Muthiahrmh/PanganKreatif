"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck, AlertCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { api, getApiErrorMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sukses, setSukses] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Memanggil endpoint backend yang baru saja kita buat
            await api.post("/auth/lupaPassword", { email });
            setSukses(true);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Lupa Kata Sandi?"
            subtitle="Masukkan email terdaftar Anda, kami akan mengirimkan tautan pemulihan."
        >
            {sukses ? (
                <div className="flex flex-col items-center py-6 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
                        <MailCheck size={36} className="text-emerald-600" />
                    </span>
                    <h3 className="font-display text-lg font-bold text-slate-900">Periksa Email Anda</h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">
                        Kami telah mengirimkan instruksi serta tautan reset kata sandi ke <strong>{email}</strong>.
                    </p>
                    <Link
                        href="/login"
                        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-blue-700"
                    >
                        Kembali ke Halaman Masuk
                    </Link>
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
                        label="Email Terdaftar"
                        type="email"
                        placeholder="nama@usaha.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Button type="submit" loading={loading} className="w-full rounded-2xl py-3.5 text-sm font-bold shadow-md">
                        Kirim Tautan Pemulihan
                    </Button>

                    <div className="text-center mt-2">
                        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900">
                            <ArrowLeft size={14} /> Kembali ke Masuk
                        </Link>
                    </div>
                </form>
            )}
        </AuthLayout>
    );
}