"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

/**
 * Blok "sebelum vs sesudah" ala Outseta — ringkasan tajam kenapa
 * PanganKreatif dibutuhkan, ditaruh setelah Manfaat supaya jadi
 * penutup argumen sebelum pembaca lanjut ke Roadmap/Statistik.
 */
const sebelum = [
    "Nebak stok dari ingatan, sering kurang atau malah kelebihan",
    "Beli bahan baku satuan — harga per unit jadi mahal",
    "Loncat WhatsApp ke banyak pemasok cuma buat bandingkan harga",
    "Ongkos kirim membengkak karena pesan sendiri-sendiri",
    "Petani jual kecil-kecil, untung tergerus ongkos angkut",
];

const sesudah = [
    "AI memprediksi kebutuhan bahan baku bulan depan",
    "Belanja kolektif otomatis dapat harga grosir",
    "Bandingkan harga, stok, dan jarak semua pemasok di satu layar",
    "Satu pengiriman melayani banyak UMKM sekaligus",
    "Dana diteruskan ke petani, transparan disertai bukti transfer",
];

export function ComparisonSection() {
    return (
        <section id="perbandingan" className="relative isolate overflow-hidden bg-white">
            {/* Cahaya ambient — senada dengan section putih lain, biar transisi
                dari kartu gelap "Sesudah" ke latar section-nya tidak terasa datar */}
            <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-teal-soft/50 blur-3xl" />

            <div className="relative mx-auto w-full max-w-[1700px] px-5 py-9 sm:px-8 sm:py-20 lg:px-16">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <span className="inline-flex rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-teal-dark">
                        Sebelum &amp; Sesudah
                    </span>

                    <h2 className="mt-2.5 font-display text-xl font-bold leading-tight text-soil sm:mt-4 sm:text-3xl md:text-4xl">
                        Dari tebak-tebakan, jadi <span className="text-teal-dark">rencana yang pasti</span>
                    </h2>

                    <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-soft sm:mt-4 sm:text-base">
                        Rantai pasok bahan baku kuliner nggak harus serumit ini.
                    </p>
                </motion.div>

                <div className="mt-5 grid gap-2.5 sm:mt-12 sm:gap-5 lg:grid-cols-2 lg:gap-6">
                    {/* Sebelum */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.5 }}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:rounded-3xl sm:p-7 lg:p-8"
                    >
                        <div className="inline-flex items-center rounded-full bg-slate-200/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-3 sm:py-1 sm:text-xs">
                            Tanpa PanganKreatif
                        </div>

                        <ul className="mt-3 flex flex-col gap-2 sm:mt-6 sm:gap-4">
                            {sebelum.map((item) => (
                                <li key={item} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-slate-500 sm:gap-3 sm:text-sm">
                                    <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-400 sm:h-5 sm:w-5">
                                        <X size={9} strokeWidth={3} className="sm:hidden" />
                                        <X size={12} strokeWidth={3} className="hidden sm:block" />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Sesudah */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#16241B] via-[#1F4D33] to-[#0B5F7D] p-3.5 text-white sm:rounded-3xl sm:p-7 lg:p-8"
                    >
                        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-leaf/10" />

                        <div className="relative">
                            <div className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white sm:px-3 sm:py-1 sm:text-xs">
                                Dengan PanganKreatif
                            </div>

                            <ul className="mt-3 flex flex-col gap-2 sm:mt-6 sm:gap-4">
                                {sesudah.map((item) => (
                                    <li key={item} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-white/90 sm:gap-3 sm:text-sm">
                                        <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-white/15 text-leaf sm:h-5 sm:w-5">
                                            <Check size={9} strokeWidth={3} className="sm:hidden" />
                                            <Check size={12} strokeWidth={3} className="hidden sm:block" />
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
