"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, X, Share, SquarePlus } from "lucide-react";

interface PromptPasang extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const KUNCI_TOLAK = "pangankreatif-pasang-ditolak";

/** Safari di iPhone atau iPad, bukan Chrome yang menyamar */
function safariIOS() {
    if (typeof window === "undefined") return false;

    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);

    // iPadOS terbaru menyamar sebagai Mac, dikenali dari layar sentuh
    const iPadModern =
        navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

    // Chrome dan Firefox di iOS tidak bisa memasang PWA
    const bukanSafari = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);

    return (iOS || iPadModern) && !bukanSafari;
}

/** Sudah dibuka sebagai aplikasi terpasang, bukan lewat peramban */
function sudahTerpasang() {
    if (typeof window === "undefined") return false;

    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        // Penanda khusus iOS
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

export function PWARegister() {
    const [prompt, setPrompt] = useState<PromptPasang | null>(null);
    const [tampil, setTampil] = useState(false);
    const [modeIOS, setModeIOS] = useState(false);

    const tolak = useCallback(() => {
        window.localStorage.setItem(KUNCI_TOLAK, "1");
        setTampil(false);
    }, []);

    // Daftarkan service worker
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!("serviceWorker" in navigator)) return;
        if (process.env.NODE_ENV !== "production") return;

        navigator.serviceWorker.register("/sw.js").catch((err) => {
            console.warn("Service worker gagal didaftarkan:", err.message);
        });
    }, []);

    // Android: tangkap tawaran bawaan peramban
    useEffect(() => {
        if (typeof window === "undefined") return;

        function tangkap(e: Event) {
            // Ditahan supaya bisa ditampilkan lewat kartu sendiri,
            // bukan sebagai bilah bawaan yang menimpa layar
            e.preventDefault();
            setPrompt(e as PromptPasang);

            if (window.localStorage.getItem(KUNCI_TOLAK) !== "1") {
                setTampil(true);
            }
        }

        window.addEventListener("beforeinstallprompt", tangkap);
        return () => window.removeEventListener("beforeinstallprompt", tangkap);
    }, []);

    // iOS: tidak ada peristiwa apa pun, jadi diputuskan dari ciri peramban
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (sudahTerpasang()) return;
        if (!safariIOS()) return;
        if (window.localStorage.getItem(KUNCI_TOLAK) === "1") return;

        // Diberi jeda supaya tidak langsung muncul begitu halaman terbuka
        const jeda = window.setTimeout(() => {
            setModeIOS(true);
            setTampil(true);
        }, 3000);

        return () => window.clearTimeout(jeda);
    }, []);

    async function pasang() {
        if (!prompt) return;

        await prompt.prompt();
        const hasil = await prompt.userChoice;

        if (hasil.outcome === "dismissed") {
            window.localStorage.setItem(KUNCI_TOLAK, "1");
        }

        setTampil(false);
        setPrompt(null);
    }

    if (!tampil) return null;

    return (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-2xl border border-ink/10 bg-white p-4 shadow-xl sm:left-auto sm:right-6">
            <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                    <Download size={19} />
                </span>

                <div className="min-w-0 flex-1">
                    <div className="font-display text-sm font-bold text-ink">
                        Pasang PanganKreatif
                    </div>
                    <p className="mt-0.5 text-xs text-ink-soft">
                        Buka langsung dari layar utama tanpa perlu mengetik alamat.
                    </p>
                </div>

                <button
                    onClick={tolak}
                    aria-label="Tutup tawaran pemasangan"
                    className="rounded-lg p-1 text-ink-soft transition hover:bg-paper-soft"
                >
                    <X size={16} />
                </button>
            </div>

            {modeIOS ? (
                <>
                    {/* Safari tidak punya tombol pasang, jadi yang bisa
                        diberikan hanyalah petunjuk langkahnya */}
                    <ol className="mt-3 space-y-2 rounded-xl bg-paper-soft p-3 text-xs text-ink-soft">
                        <li className="flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-ink">
                                1
                            </span>
                            Tekan
                            <Share size={13} className="shrink-0 text-brand-blue" />
                            di bilah bawah Safari
                        </li>

                        <li className="flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-ink">
                                2
                            </span>
                            Gulir lalu pilih
                            <SquarePlus size={13} className="shrink-0 text-brand-blue" />
                            <span className="font-medium text-ink">Add to Home Screen</span>
                        </li>
                    </ol>

                    <button
                        onClick={tolak}
                        className="mt-3 w-full rounded-lg border border-ink/10 px-3 py-2 text-xs font-medium text-ink transition hover:bg-paper-soft"
                    >
                        Mengerti
                    </button>
                </>
            ) : (
                <div className="mt-3 flex gap-2">
                    <button
                        onClick={tolak}
                        className="flex-1 rounded-lg border border-ink/10 px-3 py-2 text-xs font-medium text-ink transition hover:bg-paper-soft"
                    >
                        Nanti saja
                    </button>
                    <button
                        onClick={pasang}
                        className="flex-1 rounded-lg bg-brand-green px-3 py-2 text-xs font-medium text-white transition hover:opacity-90"
                    >
                        Pasang
                    </button>
                </div>
            )}
        </div>
    );
}