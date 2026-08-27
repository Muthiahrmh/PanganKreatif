"use client";

import { useEffect, useState } from "react";
import { Download, MonitorSmartphone, Share, SquarePlus, CheckCircle2, Zap, HardDrive } from "lucide-react";

interface PromptPasang extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function safariIOS() {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const iPadModern = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    const bukanSafari = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    return (iOS || iPadModern) && !bukanSafari;
}

function sudahTerpasang() {
    if (typeof window === "undefined") return false;
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

export function InstallSection() {
    const [prompt, setPrompt] = useState<PromptPasang | null>(null);
    const [terpasang, setTerpasang] = useState(false);
    const [modeIOS, setModeIOS] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (sudahTerpasang()) {
            setTerpasang(true);
            return;
        }

        if (safariIOS()) {
            setModeIOS(true);
            return;
        }

        function tangkap(e: Event) {
            e.preventDefault();
            setPrompt(e as PromptPasang);
        }

        window.addEventListener("beforeinstallprompt", tangkap);
        return () => window.removeEventListener("beforeinstallprompt", tangkap);
    }, []);

    async function pasang() {
        if (!prompt) return;
        await prompt.prompt();
        const hasil = await prompt.userChoice;
        if (hasil.outcome === "accepted") {
            setTerpasang(true);
        }
        setPrompt(null);
    }

    if (terpasang) {
        return (
            <section id="pasang" className="bg-cream py-10">
                <div className="mx-auto w-full max-w-[1700px] px-6 text-center sm:px-8 lg:px-16">
                    <p className="inline-flex items-center gap-2 rounded-full bg-leaf-soft px-5 py-2.5 text-sm font-semibold text-leaf-dark shadow-sm">
                        <CheckCircle2 size={18} />
                        Aplikasi PanganKreatif sudah terpasang di perangkatmu.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section id="pasang" className="bg-cream py-16 lg:py-24">
            <div className="mx-auto w-full max-w-[1700px] px-6 sm:px-8 lg:px-16">

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16241B] via-[#1F4D33] to-[#0E7A6B] p-8 text-white shadow-xl sm:p-12 lg:p-16">

                    <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-leaf/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-teal/15 blur-3xl" />

                    <div className="relative grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">

                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md">
                                <MonitorSmartphone size={13} className="text-leaf" />
                                Aplikasi Berbasis PWA
                            </span>

                            {/* Judul diubah agar mencakup PC dan HP */}
                            <h2 className="mt-6 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem]">
                                Pasang <span className="text-leaf">PanganKreatif</span>
                                <br className="hidden sm:block" /> di HP & PC Kamu
                            </h2>

                            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
                                Buka aplikasi lebih cepat tanpa mengetik alamat web. Akses langsung dari layar utama HP atau <span className="italic">desktop</span> PC layaknya aplikasi bawaan.
                            </p>

                            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur transition hover:bg-white/10">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                                        <Zap size={18} />
                                    </span>
                                    <div className="font-display text-sm font-bold text-white/90">Akses Lebih Cepat</div>
                                </div>
                                <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur transition hover:bg-white/10">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                                        <HardDrive size={18} />
                                    </span>
                                    <div className="font-display text-sm font-bold text-white/90">Tanpa Makan Memori</div>
                                </div>
                            </div>
                        </div>

                        <div className="relative flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-md lg:p-10">
                            {/* Ikon besar diubah ke MonitorSmartphone */}
                            <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner ring-1 ring-white/10">
                                <MonitorSmartphone size={32} strokeWidth={1.5} />
                            </span>

                            {modeIOS ? (
                                <div className="w-full text-left">
                                    <div className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-white/70">
                                        Cara pasang di iPhone / iPad
                                    </div>
                                    <ol className="flex flex-col gap-3 text-xs text-white/80 sm:text-sm">
                                        <li className="flex items-center gap-3 rounded-xl bg-white/5 p-3.5">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">1</span>
                                            <span>Tekan ikon <Share size={16} className="inline-block text-leaf" /> di menu bawah Safari</span>
                                        </li>
                                        <li className="flex items-center gap-3 rounded-xl bg-white/5 p-3.5">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">2</span>
                                            <span>Pilih <SquarePlus size={16} className="inline-block text-leaf" /> <strong className="text-white">Add to Home Screen</strong></span>
                                        </li>
                                    </ol>
                                </div>
                            ) : (
                                <div className="w-full">
                                    <h3 className="mb-2 font-display text-lg font-bold text-white">Aplikasi Tersedia</h3>
                                    <p className="mb-8 px-4 text-xs leading-relaxed text-white/60">
                                        Dapat dipasang di Android, Windows, dan macOS.
                                    </p>
                                    <button
                                        onClick={pasang}
                                        disabled={!prompt}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-soil shadow-xl transition-all hover:scale-[1.02] hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 sm:text-base"
                                    >
                                        <Download size={18} className="text-leaf-dark" />
                                        {prompt ? "Instal Aplikasi Sekarang" : "Aplikasi Siap Digunakan"}
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
}