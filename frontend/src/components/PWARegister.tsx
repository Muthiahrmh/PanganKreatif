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
        // Background overlay gelap dan blur
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-soil/60 p-4 backdrop-blur-sm transition-opacity">
            {/* Modal Box */}
            <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-7 text-center shadow-2xl sm:p-10">

                {/* Tombol Tutup (X) di pojok kanan atas */}
                <button
                    onClick={tolak}
                    aria-label="Tutup tawaran pemasangan"
                    className="absolute right-5 top-5 rounded-full p-2 text-ink-soft transition hover:bg-paper-soft hover:text-ink"
                >
                    <X size={22} />
                </button>

                <div className="flex flex-col items-center">
                    {/* Ikon besar di tengah */}
                    <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-brand-green/15 text-brand-green shadow-sm ring-8 ring-brand-green/5">
                        <Download size={36} strokeWidth={1.5} />
                    </span>

                    <h2 className="font-display text-2xl font-bold text-soil sm:text-3xl">
                        Pasang PanganKreatif
                    </h2>
                    <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                        Buka langsung dari layar utama HP kamu tanpa perlu repot mengetik alamat web lagi. Lebih cepat dan praktis!
                    </p>

                    {modeIOS ? (
                        <div className="mt-8 w-full rounded-2xl bg-paper-soft p-5 text-left text-sm text-ink-soft shadow-inner">
                            <ol className="space-y-4">
                                <li className="flex items-center gap-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-ink shadow-sm">
                                        1
                                    </span>
                                    <span>
                                        Tekan ikon <Share size={16} className="inline-block text-brand-blue" /> di bilah bawah Safari
                                    </span>
                                </li>

                                <li className="flex items-center gap-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-ink shadow-sm">
                                        2
                                    </span>
                                    <span>
                                        Gulir ke bawah lalu pilih{" "}
                                        <SquarePlus size={16} className="inline-block text-brand-blue" />{" "}
                                        <span className="font-bold text-ink">Add to Home Screen</span>
                                    </span>
                                </li>
                            </ol>

                            <button
                                onClick={tolak}
                                className="mt-6 w-full rounded-full border border-ink/10 bg-white py-3.5 text-sm font-semibold text-ink transition hover:bg-gray-50"
                            >
                                Saya Mengerti
                            </button>
                        </div>
                    ) : (
                        <div className="mt-8 flex w-full flex-col-reverse gap-3 sm:flex-row">
                            <button
                                onClick={tolak}
                                className="w-full rounded-full border border-ink/10 py-3.5 text-[15px] font-semibold text-ink transition hover:bg-paper-soft"
                            >
                                Nanti Saja
                            </button>
                            <button
                                onClick={pasang}
                                className="w-full rounded-full bg-brand-green py-3.5 text-[15px] font-semibold text-white shadow-md transition hover:bg-brand-green/90 hover:shadow-lg"
                            >
                                Pasang Sekarang
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}