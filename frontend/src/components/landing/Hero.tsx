"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Store, Sprout } from "lucide-react";

export function Hero() {
    return (
        <section id="beranda" className="relative isolate min-h-[92vh] overflow-hidden bg-soil">
            {/* Lapisan 0: foto pasar tani asli — zoom lambat & halus, bukan diam */}
            <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: 1.08 }}
                transition={{ duration: 24, ease: "easeOut" }}
                className="absolute inset-0 z-0"
            >
                <Image
                    src="/images/hero-pasar-tani.jpg"
                    alt="Transaksi bahan baku segar di pasar tradisional"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-center"
                />
            </motion.div>

            {/* Lapisan 1: scrim gelap supaya teks tetap kontras di atas foto */}
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/75 via-black/55 to-black/85" />
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

            {/* Lapisan 2: konten teks marketing, paling depan */}
            <div className="relative z-20 mx-auto flex min-h-[92vh] w-full max-w-[1100px] flex-col items-center justify-center px-6 py-24 text-center sm:px-8">
                <motion.span
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md"
                >
                    <Sparkles size={13} className="text-leaf" />
                    AI Demand Forecasting &amp; B2B Supply Chain
                </motion.span>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mt-6 font-display text-4xl font-bold leading-[1.15] text-white drop-shadow-lg sm:text-5xl lg:text-6xl"
                >
                    Menghubungkan <span className="text-leaf">UMKM Kuliner</span>
                    <br className="hidden sm:block" /> &amp; <span className="text-teal">Kelompok Tani</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-6 max-w-xl text-base leading-relaxed text-white/85 drop-shadow sm:text-lg"
                >
                    Belanja Kolektif untuk harga grosir, dan Prediksi Bahan Baku berbasis AI
                    supaya stok dapur tidak pernah meleset.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-10 flex flex-col gap-3 sm:flex-row"
                >
                    <Link
                        href="/register?role=umkm"
                        className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-soil shadow-xl transition-all hover:scale-[1.03] hover:shadow-2xl sm:text-base"
                    >
                        <Store size={18} className="text-teal-dark" />
                        Daftar sebagai UMKM Kuliner
                        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </Link>

                    <Link
                        href="/register?role=supplier"
                        className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 sm:text-base"
                    >
                        <Sprout size={18} className="text-leaf" />
                        Daftar sebagai Kelompok Tani
                        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </motion.div>
            </div>

            {/* Kredit foto — lisensi Unsplash tidak mewajibkan, tapi sopan disertakan */}
            <a
                href="https://unsplash.com/@aliffhassan91"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-4 z-20 text-[10px] text-white/40 hover:text-white/70"
            >
                Foto: Alex Hudson / Unsplash
            </a>
        </section>
    );
}
