"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * Dialog konfirmasi.
 *
 * Menggantikan window.confirm bawaan peramban, yang tampilannya
 * berbeda di tiap sistem operasi dan tidak bisa menjelaskan akibat
 * sebuah tindakan dengan memadai.
 */
export function DialogKonfirmasi({
    terbuka,
    judul,
    pesan,
    keterangan,
    labelYa = "Lanjutkan",
    labelBatal = "Batal",
    bahaya = false,
    sibuk = false,
    onYa,
    onBatal,
}: {
    terbuka: boolean;
    judul: string;
    pesan: string;
    /** Baris tambahan untuk menjelaskan akibatnya */
    keterangan?: string;
    labelYa?: string;
    labelBatal?: string;
    bahaya?: boolean;
    sibuk?: boolean;
    onYa: () => void;
    onBatal: () => void;
}) {
    // Escape menutup dialog, kebiasaan yang sudah umum
    useEffect(() => {
        if (!terbuka) return;

        function tekan(e: KeyboardEvent) {
            if (e.key === "Escape" && !sibuk) onBatal();
        }

        document.addEventListener("keydown", tekan);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", tekan);
            document.body.style.overflow = "";
        };
    }, [terbuka, sibuk, onBatal]);

    if (!terbuka) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-4 sm:items-center"
            onClick={() => !sibuk && onBatal()}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-label={judul}
                className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bahaya ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                                }`}
                        >
                            <AlertTriangle size={17} />
                        </span>

                        <div>
                            <h3 className="font-display text-base font-bold text-ink">{judul}</h3>
                            <p className="mt-1 text-sm text-ink-soft">{pesan}</p>
                        </div>
                    </div>

                    <button
                        onClick={onBatal}
                        disabled={sibuk}
                        aria-label="Tutup"
                        className="rounded-lg p-1 text-ink-soft transition hover:bg-paper-soft disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>
                </div>

                {keterangan && (
                    <p
                        className={`mt-3 rounded-lg px-3 py-2 text-xs ${bahaya ? "bg-red-50 text-red-700" : "bg-paper-soft text-ink-soft"
                            }`}
                    >
                        {keterangan}
                    </p>
                )}

                <div className="mt-5 flex gap-3">
                    <button
                        onClick={onBatal}
                        disabled={sibuk}
                        className="flex-1 rounded-lg border border-ink/10 px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-paper-soft disabled:opacity-50"
                    >
                        {labelBatal}
                    </button>

                    <button
                        onClick={onYa}
                        disabled={sibuk}
                        className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-60 ${bahaya
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-brand-green hover:bg-brand-green-dark"
                            }`}
                    >
                        {sibuk ? "Memproses..." : labelYa}
                    </button>
                </div>
            </div>
        </div>
    );
}