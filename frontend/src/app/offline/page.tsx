import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata = {
    title: "Tidak ada koneksi — PanganKreatif",
};

export default function OfflinePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-paper-soft/40 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                <WifiOff size={30} className="text-ink-soft" />
            </span>

            <h1 className="mt-5 font-display text-xl font-bold text-ink">
                Tidak ada koneksi
            </h1>

            <p className="mt-2 max-w-sm text-sm text-ink-soft">
                Halaman ini belum pernah dibuka sebelumnya, jadi belum tersimpan. Sambungkan
                kembali internetmu lalu coba lagi.
            </p>

            <Link
                href="/dashboard"
                className="mt-6 rounded-lg bg-brand-green px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
                Coba buka dashboard
            </Link>
        </div>
    );
}