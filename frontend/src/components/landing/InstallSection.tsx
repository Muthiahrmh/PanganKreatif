"use client";

import { motion } from "framer-motion";
import { Download, Smartphone, Zap, ShieldCheck, CheckCircle2 } from "lucide-react";
import { PhoneMockup } from "./PhoneMockup";

/**
 * Unduh APK Android asli — bukan lagi PWA. File-nya dilayani langsung
 * dari public/downloads, jadi tautan unduh ini murni HTML biasa
 * (tidak perlu state/JS apa pun, berbeda dari versi PWA sebelumnya
 * yang bergantung pada event beforeinstallprompt milik peramban).
 *
 * Panel kanan sekarang menampilkan PhoneMockup — cuplikan tampilan
 * aplikasi asli — supaya pengunjung lihat dulu produknya sebelum
 * unduh, bukan cuma ikon generik. PhoneMockup sudah dibuat sebelumnya
 * tapi belum dipakai di mana pun, jadi ditempatkan di sini.
 */
export function InstallSection() {
    return (
        <section id="pasang" className="bg-pola-tani-halus py-5 sm:py-10 lg:py-14">
            <div className="mx-auto w-full max-w-[1700px] px-5 sm:px-8 lg:px-16">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16241B] via-[#1F4D33] to-[#0B5F7D] p-4 text-white shadow-xl sm:rounded-3xl sm:p-12 lg:p-16"
                >

                    <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-leaf/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-teal/15 blur-3xl" />

                    <div className="relative grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">

                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md sm:px-3.5 sm:py-1.5 sm:text-xs">
                                <Smartphone size={12} className="text-leaf" />
                                Aplikasi Android
                            </span>

                            <h2 className="mt-3 font-display text-xl font-bold leading-tight sm:mt-6 sm:text-3xl lg:text-[2.75rem]">
                                Unduh <span className="text-leaf">PanganKreatif</span>
                                <br className="hidden sm:block" /> untuk Android
                            </h2>

                            <p className="mt-2.5 max-w-lg text-[12px] leading-relaxed text-white/80 sm:mt-5 sm:text-base">
                                Pasang aplikasi Android resmi PanganKreatif dan kelola rantai pasok bahan bakumu langsung dari HP, kapan pun dan di mana pun.
                            </p>

                            {/* Dipaksa tetap 2 kolom sebelahan sejak HP terkecil — ukuran
                                ikon/padding/teks mengecil khusus di mobile supaya tetap
                                muat, bukan numpuk jadi 1 kolom ke bawah. */}
                            <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-4">
                                <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 p-2.5 backdrop-blur transition hover:bg-white/10 sm:gap-3 sm:rounded-2xl sm:p-4">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white sm:h-11 sm:w-11 sm:rounded-xl">
                                        <Zap size={12} className="sm:hidden" />
                                        <Zap size={18} className="hidden sm:block" />
                                    </span>
                                    <div className="font-display text-[11px] font-bold leading-tight text-white/90 sm:text-sm">Akses Lebih Cepat</div>
                                </div>
                                <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 p-2.5 backdrop-blur transition hover:bg-white/10 sm:gap-3 sm:rounded-2xl sm:p-4">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white sm:h-11 sm:w-11 sm:rounded-xl">
                                        <ShieldCheck size={12} className="sm:hidden" />
                                        <ShieldCheck size={18} className="hidden sm:block" />
                                    </span>
                                    <div className="font-display text-[11px] font-bold leading-tight text-white/90 sm:text-sm">Aman &amp; Terpercaya</div>
                                </div>
                            </div>

                            {/* Tombol unduh dipindah ke kolom kiri, sejajar teks —
                                di kolom kanan sekarang giliran PhoneMockup tampil */}
                            <a
                                href="/downloads/pangankreatif.apk"
                                download
                                className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-[13px] font-bold text-soil shadow-xl transition-all hover:scale-[1.02] hover:bg-cream sm:mt-8 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
                            >
                                <Download size={16} className="text-leaf-dark transition-transform group-hover:translate-y-0.5 sm:hidden" />
                                <Download size={18} className="hidden text-leaf-dark transition-transform group-hover:translate-y-0.5 sm:block" />
                                Unduh APK Android
                            </a>

                            <p className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-white/50 sm:mt-3 sm:text-xs">
                                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-leaf" />
                                Untuk perangkat Android. Perlu mengizinkan &quot;instal dari sumber tidak dikenal&quot; karena belum dirilis lewat Play Store.
                            </p>
                        </div>

                        {/* Dua PhoneMockup berdampingan — sisi UMKM & sisi Kelompok
                            Tani, dimiringkan berlawanan arah ala pajangan produk,
                            dengan cahaya ambient di belakangnya. Bezel-nya generik
                            (bukan notch iPhone) karena aplikasinya cuma untuk
                            Android — sesuai pengguna kita, UMKM & Kelompok Tani. */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                            className="relative mx-auto flex flex-col items-center py-1 sm:py-4 lg:py-0"
                        >
                            <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
                                <div className="h-72 w-72 rounded-full bg-leaf/25 blur-3xl" />
                            </div>

                            {/* PERBAIKAN: pakai CSS zoom (bukan transform scale) supaya
                                ukuran yang direservasi di tata letak ikut mengecil di HP —
                                kalau pakai scale doang, kotaknya tetap sebesar ukuran asli
                                walau tampilannya kelihatan kecil, jadi nyisa ruang kosong
                                aneh di sekitarnya. Aplikasi Android kita WebView Chromium,
                                jadi zoom didukung penuh di sana. */}
                            <div className="flex items-center -space-x-11 [zoom:0.55] sm:-space-x-6 sm:[zoom:1]">
                                <div className="-rotate-6 transition-transform duration-500 hover:z-20 hover:-translate-y-1 hover:rotate-0">
                                    <PhoneMockup peran="umkm" />
                                </div>
                                <div className="relative z-10 translate-y-4 rotate-6 transition-transform duration-500 hover:z-20 hover:-translate-y-1 hover:rotate-0">
                                    <PhoneMockup peran="supplier" />
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-4 text-[11px] font-semibold text-white/70 sm:mt-6">
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                                    Sisi UMKM
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
                                    Sisi Kelompok Tani
                                </span>
                            </div>
                        </motion.div>

                    </div>
                </motion.div>

            </div>
        </section>
    );
}
