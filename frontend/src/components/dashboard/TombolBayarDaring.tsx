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
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">
                <Check size={16} className="shrink-0" />
                Lunas{kanal ? ` lewat ${kanal}` : ""}
            </div>
        );
    }

    const sibuk = tahap === "menyiapkan" || tahap === "memeriksa";

    return (
        <div className="space-y-2">
            {tahap === "diam" && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    <span>
                        Pilih cara bayar dengan teliti. Di dalam jendela pembayaran tidak ada tombol
                        kembali — kalau salah pilih, tutup jendelanya lalu klik Bayar lagi.
                    </span>
                </div>
            )}

            <button
                onClick={bayar}
                disabled={sibuk || tahap === "membayar"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
                {sibuk ? (
                    <>
                        <Loader2 size={15} className="animate-spin" />
                        {tahap === "menyiapkan" ? "Menyiapkan..." : "Memeriksa status..."}
                    </>
                ) : (
                    <>
                        <CreditCard size={15} />
                        Bayar {rupiah(jumlah)}
                    </>
                )}
            </button>

            {tahap === "diam" && (
                <p className="text-center text-xs text-ink-soft">
                    GoPay, ShopeePay, QRIS, kartu, atau virtual account
                </p>
            )}

            {tahap === "menunggu" && pesan && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{pesan}</p>
            )}

            {tahap === "gagal" && pesan && (
                <p className="flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    <X size={13} className="mt-0.5 shrink-0" />
                    {pesan}
                </p>
            )}
        </div>
    );
}