"use client";

import { useState } from "react";
import { CreditCard, Loader2, Check, X, AlertTriangle } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api";
import { mulaiPembayaran, periksaStatusPembayaran, muatSnap } from "@/lib/payment";

type Tahap = "diam" | "menyiapkan" | "membayar" | "memeriksa" | "berhasil" | "menunggu" | "gagal";

export function TombolBayarMidtrans({
    itemId,
    jumlah,
    onLunas,
}: {
    itemId: string;
    jumlah: number;
    onLunas?: () => void;
}) {
    const [tahap, setTahap] = useState<Tahap>("diam");
    const [pesan, setPesan] = useState<string | null>(null);
    const [kanal, setKanal] = useState<string | null>(null);

    const rupiah = (n: number) => `Rp${Math.round(n).toLocaleString("id-ID")}`;

    async function tanyaStatus(transactionId: string, percobaan = 0) {
        setTahap("memeriksa");
        try {
            const hasil = await periksaStatusPembayaran(transactionId);

            if (hasil.status === "success") {
                setKanal(hasil.channel);
                setTahap("berhasil");
                onLunas?.();
                return;
            }

            if (hasil.status === "failed") {
                setTahap("gagal");
                setPesan("Pembayaran dibatalkan atau kedaluwarsa. Coba lagi kalau perlu.");
                return;
            }

            if (percobaan < 3) {
                window.setTimeout(() => tanyaStatus(transactionId, percobaan + 1), 3000);
                return;
            }

            setTahap("menunggu");
            setPesan(
                "Pembayaran belum terkonfirmasi. Kalau sudah membayar, muat ulang halaman beberapa saat lagi."
            );
        } catch (err) {
            setTahap("gagal");
            setPesan(getApiErrorMessage(err));
        }
    }

    async function bayar() {
        setTahap("menyiapkan");
        setPesan(null);

        try {
            const sesi = await mulaiPembayaran(itemId);
            await muatSnap(sesi.clientKey, sesi.produksi);

            if (!window.snap) throw new Error("Jendela pembayaran gagal dimuat");

            setTahap("membayar");

            window.snap.pay(sesi.snapToken, {
                onSuccess: () => tanyaStatus(sesi.transactionId),
                onPending: () => tanyaStatus(sesi.transactionId),
                onClose: () => tanyaStatus(sesi.transactionId),
                onError: () => {
                    setTahap("gagal");
                    setPesan("Pembayaran gagal diproses.");
                },
            });
        } catch (err) {
            setTahap("gagal");
            setPesan(getApiErrorMessage(err));
        }
    }

    if (tahap === "berhasil") {
        return (
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 border border-emerald-100 shadow-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0">
                    <Check size={14} strokeWidth={3} />
                </div>
                Lunas{kanal ? ` lewat ${kanal}` : ""}
            </div>
        );
    }

    const sibuk = tahap === "menyiapkan" || tahap === "memeriksa";

    return (
        <div className="space-y-3">
            {tahap === "diam" && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-900 leading-relaxed shadow-sm">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                    <span>
                        Pilih cara bayar dengan teliti. Di dalam jendela pembayaran tidak ada tombol
                        kembali — kalau salah pilih, tutup jendelanya lalu klik <strong>Bayar lagi</strong>.
                    </span>
                </div>
            )}

            <button
                onClick={bayar}
                disabled={sibuk || tahap === "membayar"}
                className="group inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-5 py-3.5 text-[15px] font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {sibuk ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        {tahap === "menyiapkan" ? "Menyiapkan..." : "Memeriksa status..."}
                    </>
                ) : (
                    <>
                        <CreditCard size={18} className="transition-transform group-hover:scale-110" />
                        Bayar {rupiah(jumlah)}
                    </>
                )}
            </button>

            {tahap === "diam" && (
                <p className="text-center text-xs font-medium text-slate-400">
                    Mendukung GoPay, ShopeePay, QRIS, Kartu, atau Virtual Account
                </p>
            )}

            {tahap === "menunggu" && pesan && (
                <p className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs font-medium text-amber-800 leading-relaxed shadow-sm">
                    {pesan}
                </p>
            )}

            {tahap === "gagal" && pesan && (
                <p className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-medium text-red-700 shadow-sm">
                    <X size={16} className="mt-0.5 shrink-0" />
                    {pesan}
                </p>
            )}
        </div>
    );
}