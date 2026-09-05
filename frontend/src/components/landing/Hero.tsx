"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Store, Sprout, ShieldCheck, CloudSun } from "lucide-react";

/** Panah coretan-tangan ala Outseta — lengkung sederhana + kepala panah,
 *  digambar manual jadi SVG, bukan aset gambar. Dipakai hemat, cuma satu
 *  titik di hero, dan otomatis disembunyikan di layar sempit. */
function PanahCoretan({ className }: { className?: string }) {
    return (
        <svg
            width="72"
            height="60"
            viewBox="0 0 72 60"
            fill="none"
            className={className}
            aria-hidden
        >
            <path
                d="M66 5C49 2 22 9 12 27C7 37 7 45 9 53"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
            />
            <path
                d="M2 45L9 53L18 48"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

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

            {/* Lapisan 2: konten teks marketing, paling depan.
                PERBAIKAN MOBILE: padding & jarak vertikal dipangkas, dan judul/
                paragraf diperkecil khusus di HP (breakpoint sm: ke atas balik
                ke ukuran semula) — supaya seluruh isi hero (bukan cuma badge)
                muat kelihatan tanpa perlu discroll dulu di layar pendek. */}
            <div className="relative z-20 mx-auto flex min-h-[92vh] w-full max-w-[1100px] flex-col items-center justify-center px-6 py-14 text-center sm:px-8 sm:py-24">
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
                    className="mt-4 font-display text-3xl font-bold leading-[1.15] text-white drop-shadow-lg sm:mt-6 sm:text-5xl lg:text-6xl"
                >
                    Menghubungkan <span className="text-leaf">UMKM Kuliner</span>
                    <br className="hidden sm:block" /> &amp; <span className="text-teal">Kelompok Tani</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 drop-shadow sm:mt-6 sm:text-lg"
                >
                    Belanja Kolektif untuk harga grosir, dan Prediksi Bahan Baku berbasis AI
                    supaya stok dapur tidak pernah meleset.
                </motion.p>

                <div className="relative mt-6 sm:mt-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-row gap-2 sm:gap-3"
                    >
                        {/* Dua tombol dipaksa tetap sebelahan mulai dari HP terkecil —
                            bukan numpuk ke bawah — dengan padding, ikon, dan label
                            yang mengecil/memendek khusus di layar sempit supaya tetap
                            muat, lalu balik ke ukuran & teks lengkap dari sm ke atas. */}
                        <Link
                            href="/register?role=umkm"
                            className="group flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-3 py-2.5 text-xs font-bold text-soil shadow-xl transition-all hover:scale-[1.03] hover:shadow-2xl sm:flex-initial sm:gap-2 sm:px-7 sm:py-3.5 sm:text-base"
                        >
                            <Store size={15} className="shrink-0 text-teal-dark sm:hidden" />
                            <Store size={18} className="hidden shrink-0 text-teal-dark sm:block" />
                            <span className="sm:hidden">UMKM Kuliner</span>
                            <span className="hidden sm:inline">Daftar sebagai UMKM Kuliner</span>
                            <ArrowRight size={15} className="hidden shrink-0 transition-transform group-hover:translate-x-0.5 sm:inline-block" />
                        </Link>

                        <Link
                            href="/register?role=supplier"
                            className="group flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 sm:flex-initial sm:gap-2 sm:px-7 sm:py-3.5 sm:text-base"
                        >
                            <Sprout size={15} className="shrink-0 text-leaf sm:hidden" />
                            <Sprout size={18} className="hidden shrink-0 text-leaf sm:block" />
                            <span className="sm:hidden">Kelompok Tani</span>
                            <span className="hidden sm:inline">Daftar sebagai Kelompok Tani</span>
                            <ArrowRight size={15} className="hidden shrink-0 transition-transform group-hover:translate-x-0.5 sm:inline-block" />
                        </Link>
                    </motion.div>

                    {/* Coretan tangan dekoratif ala Outseta — cuma nongol di layar
                        lebar, biar kesannya playful tapi nggak sumpek di HP */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                        className="pointer-events-none absolute -right-6 -top-16 hidden -rotate-6 flex-col items-center text-white/75 lg:flex xl:-right-20"
                    >
                        <span className="font-hand text-2xl leading-none">Gratis, langsung aktif!</span>
                        <PanahCoretan className="mt-1" />
                    </motion.div>
                </div>

                {/* Badge kepercayaan — mitra pembayaran & sumber data resmi,
                    ala "Stripe Verified Partner" punya Outseta */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-white/60 sm:mt-8"
                >
                    <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-teal-300" />
                        Pembayaran aman via Midtrans
                    </span>
                    <span className="hidden h-3 w-px bg-white/20 sm:inline-block" />
                    <span className="inline-flex items-center gap-1.5">
                        <CloudSun size={14} className="text-leaf" />
                        Prediksi cuaca dari data resmi BMKG
                    </span>
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
