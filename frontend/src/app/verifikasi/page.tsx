"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, MailWarning } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { getApiErrorMessage } from "@/lib/api";
import { verifikasiEmail, kirimUlangVerifikasi } from "@/lib/verifikasi";

type Tahap = "memeriksa" | "berhasil" | "kedaluwarsa" | "gagal";

const DETIK_ALIH = 5;

function IsiVerifikasi() {
    const router = useRouter();
    const params = useSearchParams();

    const [tahap, setTahap] = useState<Tahap>("memeriksa");
    const [pesan, setPesan] = useState<string | null>(null);
    const [sudahPernah, setSudahPernah] = useState(false);
    const [email, setEmail] = useState<string>("");
    const [mengirim, setMengirim] = useState(false);
    const [hitungMundur, setHitungMundur] = useState(DETIK_ALIH);

    const token = params.get("token");

    const periksa = useCallback(async () => {
        if (!token) {
            setTahap("gagal");
            setPesan("Tautan tidak lengkap. Buka tautan yang dikirim ke emailmu.");
            return;
        }

        try {
            const hasil = await verifikasiEmail(token);
            setSudahPernah(Boolean(hasil.sudahPernah));
            setEmail(hasil.email ?? "");
            setTahap("berhasil");
        } catch (err) {
            const pesanGalat = getApiErrorMessage(err);
            const kedaluwarsa = pesanGalat.toLowerCase().includes("kedaluwarsa");

            setTahap(kedaluwarsa ? "kedaluwarsa" : "gagal");
            setPesan(pesanGalat);
        }
    }, [token]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        periksa();
    }, [periksa]);

    // Hitung mundur menuju halaman masuk setelah berhasil
    useEffect(() => {
        if (tahap !== "berhasil") return;

        const detak = window.setInterval(() => {
            setHitungMundur((n) => {
                if (n <= 1) {
                    window.clearInterval(detak);
                    router.push("/login");
                    return 0;
                }
                return n - 1;
            });
        }, 1000);

        return () => window.clearInterval(detak);
    }, [tahap, router]);

    async function kirimUlang() {
        if (!email.trim()) {
            setPesan("Masukkan alamat email yang kamu daftarkan.");
            return;
        }

        setMengirim(true);
        try {
            const hasil = await kirimUlangVerifikasi(email.trim());
            setPesan(hasil.pesan);
        } catch (err) {
            setPesan(getApiErrorMessage(err));
        } finally {
            setMengirim(false);
        }
    }

    if (tahap === "memeriksa") {
        return (
            <div className="flex flex-col items-center py-8 text-center">
                <Loader2 size={36} className="animate-spin text-brand-blue" />
                <p className="mt-4 text-sm text-ink-soft">Memeriksa tautan verifikasi...</p>
            </div>
        );
    }

    if (tahap === "berhasil") {
        return (
            <div className="flex flex-col items-center py-6 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                    <CheckCircle2 size={38} className="text-brand-green" />
                </span>

                <h2 className="mt-5 font-display text-xl font-bold text-ink">
                    {sudahPernah ? "Akun sudah terverifikasi" : "Akun berhasil diverifikasi"}
                </h2>

                <p className="mt-2 text-sm text-ink-soft">
                    {sudahPernah
                        ? "Email ini sudah pernah diverifikasi sebelumnya."
                        : "Alamat emailmu sudah terkonfirmasi."}{" "}
                    Silakan masuk memakai email dan password yang kamu daftarkan.
                </p>

                {email && (
                    <p className="mt-1 text-sm font-medium text-ink">{email}</p>
                )}

                <Link
                    href="/login"
                    className="mt-6 w-full rounded-xl bg-brand-green px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                >
                    Masuk sekarang
                </Link>

                <p className="mt-3 text-xs text-ink-soft">
                    Dialihkan ke halaman masuk dalam {hitungMundur} detik
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center py-4 text-center">
            <span
                className={`flex h-16 w-16 items-center justify-center rounded-full ${tahap === "kedaluwarsa" ? "bg-amber-50" : "bg-red-50"
                    }`}
            >
                {tahap === "kedaluwarsa" ? (
                    <MailWarning size={36} className="text-amber-500" />
                ) : (
                    <XCircle size={36} className="text-red-500" />
                )}
            </span>

            <h2 className="mt-5 font-display text-xl font-bold text-ink">
                {tahap === "kedaluwarsa" ? "Tautan sudah kedaluwarsa" : "Verifikasi gagal"}
            </h2>

            {pesan && <p className="mt-2 text-sm text-ink-soft">{pesan}</p>}

            <div className="mt-6 w-full">
                <label className="block text-left text-sm font-medium text-ink">
                    Kirim ulang tautan verifikasi
                </label>

                <div className="mt-1.5 flex gap-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@usaha.com"
                        className="w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/50 focus:border-brand-blue"
                    />
                    <Button onClick={kirimUlang} loading={mengirim} className="shrink-0">
                        Kirim
                    </Button>
                </div>
            </div>

            <p className="mt-6 text-sm text-ink-soft">
                Sudah terverifikasi?{" "}
                <Link href="/login" className="font-semibold text-brand-blue hover:underline">
                    Masuk di sini
                </Link>
            </p>
        </div>
    );
}

export default function VerifikasiPage() {
    return (
        <AuthLayout
            title="Verifikasi Email"
            subtitle="Satu langkah lagi sebelum akunmu bisa dipakai."
        >
            <Suspense
                fallback={
                    <div className="flex justify-center py-8">
                        <Loader2 size={32} className="animate-spin text-brand-blue" />
                    </div>
                }
            >
                <IsiVerifikasi />
            </Suspense>
        </AuthLayout>
    );
}