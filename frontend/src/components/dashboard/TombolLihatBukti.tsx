"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";

/**
 * Membuka bukti transfer.
 *
 * Berkasnya disimpan di bucket privat, jadi tautannya tidak bisa
 * ditempel langsung di halaman. Tombol ini meminta tautan bertanda
 * tangan berumur lima menit, lalu membukanya di tab baru.
 */
export function TombolLihatBukti({
    transactionId,
    jenis = "bayar",
    label = "Lihat bukti transfer",
}: {
    transactionId: string;
    jenis?: "bayar" | "payout";
    label?: string;
}) {
    const [memuat, setMemuat] = useState(false);
    const [galat, setGalat] = useState<string | null>(null);

    async function buka() {
        setMemuat(true);
        setGalat(null);

        try {
            const res = await api.get<{ url: string }>(
                `/files/transaksi/${transactionId}/${jenis}`
            );
            window.open(res.data.url, "_blank", "noopener,noreferrer");
        } catch (err) {
            setGalat(getApiErrorMessage(err));
        } finally {
            setMemuat(false);
        }
    }

    return (
        <span className="inline-flex flex-col">
            <button
                onClick={buka}
                disabled={memuat}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-blue transition hover:underline disabled:opacity-60"
            >
                {memuat ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                {memuat ? "Membuka..." : label}
            </button>

            {galat && <span className="mt-0.5 text-[11px] text-red-600">{galat}</span>}
        </span>
    );
}