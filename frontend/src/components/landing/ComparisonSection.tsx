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

            <div className="relative mx-auto w-full max-w-[1700px] px-6 py-20 sm:px-8 lg:px-16">
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

                    <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-soil md:text-4xl">
                        Dari tebak-tebakan, jadi <span className="text-teal-dark">rencana yang pasti</span>
                    </h2>

                    <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
                        Rantai pasok bahan baku kuliner nggak harus serumit ini.
                    </p>
                </motion.div>

                <div className="mt-12 grid gap-5 lg:grid-cols-2 lg:gap-6">
                    {/* Sebelum */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.5 }}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-7 sm:p-8"
                    >
                        <div className="inline-flex items-center rounded-full bg-slate-200/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Tanpa PanganKreatif
                        </div>

                        <ul className="mt-6 flex flex-col gap-4">
                            {sebelum.map((item) => (
                                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-slate-500">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-400">
                                        <X size={12} strokeWidth={3} />
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
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16241B] via-[#1F4D33] to-[#0B5F7D] p-7 text-white sm:p-8"
                    >
                        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-leaf/10" />

                        <div className="relative">
                            <div className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                                Dengan PanganKreatif
                            </div>

                            <ul className="mt-6 flex flex-col gap-4">
                                {sesudah.map((item) => (
                                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-white/90">
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-leaf">
                                            <Check size={12} strokeWidth={3} />
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
