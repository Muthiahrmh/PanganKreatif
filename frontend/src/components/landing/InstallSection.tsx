import { Download, Smartphone, Zap, ShieldCheck } from "lucide-react";

/**
 * Unduh APK Android asli — bukan lagi PWA. File-nya dilayani langsung
 * dari public/downloads, jadi tautan unduh ini murni HTML biasa
 * (tidak perlu state/JS apa pun, berbeda dari versi PWA sebelumnya
 * yang bergantung pada event beforeinstallprompt milik peramban).
 */
export function InstallSection() {
    return (
        <section id="pasang" className="bg-cream py-16 lg:py-24">
            <div className="mx-auto w-full max-w-[1700px] px-6 sm:px-8 lg:px-16">

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16241B] via-[#1F4D33] to-[#0E7A6B] p-8 text-white shadow-xl sm:p-12 lg:p-16">

                    <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-leaf/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-teal/15 blur-3xl" />

                    <div className="relative grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">

                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md">
                                <Smartphone size={13} className="text-leaf" />
                                Aplikasi Android
                            </span>

                            <h2 className="mt-6 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem]">
                                Unduh <span className="text-leaf">PanganKreatif</span>
                                <br className="hidden sm:block" /> untuk Android
                            </h2>

                            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
                                Pasang aplikasi Android resmi PanganKreatif dan kelola rantai pasok bahan bakumu langsung dari HP, kapan pun dan di mana pun.
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
                                        <ShieldCheck size={18} />
                                    </span>
                                    <div className="font-display text-sm font-bold text-white/90">Aman &amp; Terpercaya</div>
                                </div>
                            </div>
                        </div>

                        <div className="relative flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-md lg:p-10">
                            <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner ring-1 ring-white/10">
                                <Smartphone size={32} strokeWidth={1.5} />
                            </span>

                            <div className="w-full">
                                <h3 className="mb-2 font-display text-lg font-bold text-white">Aplikasi Tersedia</h3>
                                <p className="mb-8 px-4 text-xs leading-relaxed text-white/60">
                                    Untuk perangkat Android. Perlu mengizinkan &quot;instal dari sumber tidak dikenal&quot; karena belum dirilis lewat Play Store.
                                </p>
                                <a
                                    href="/downloads/pangankreatif.apk"
                                    download
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-soil shadow-xl transition-all hover:scale-[1.02] hover:bg-cream sm:text-base"
                                >
                                    <Download size={18} className="text-leaf-dark" />
                                    Unduh APK Android
                                </a>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
}
