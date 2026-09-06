"use client";

import { motion } from "framer-motion";
import {
    GraduationCap,
    Target,
    Lightbulb,
    MapPin,
    Quote,
    Trophy,
} from "lucide-react";

const tim = [
    { nama: "Muthiah Rahma Pasaribu", peran: "Ketua Tim", nim: "2023573010101" },
    { nama: "Livia Safirani", peran: "Anggota Tim", nim: "2023573010138" },
    { nama: "Adha Gusti Harmadhan", peran: "Anggota Tim", nim: "2024573010009" },
];

const cerita = [
    {
        icon: Target,
        judul: "Masalah yang kami temukan",
        desc: "Pemilik warung menebak stok dari ingatan dan beli satuan mahal, sementara petani jual kecil-kecil dengan ongkos kirim yang menggerus untung.",
        warna: "#2563EB", // Biru lembut
        latar: "#EFF6FF",
    },
    {
        icon: Lightbulb,
        judul: "Cara kami menjawabnya",
        desc: "AI memperkirakan kebutuhan bahan baku, lalu beberapa UMKM digabung jadi satu pesanan besar — harga per satuan pun turun.",
        warna: "#0E7FA6", // Teal-biru
        latar: "#E3F2F7",
    },
    {
        icon: MapPin,
        judul: "Kenapa mulai dari Aceh",
        desc: "Kami tinggal di Lhokseumawe dan melihat masalah ini sendiri, jadi prediksinya ikut memperhitungkan pola musiman khas Aceh seperti Meugang.",
        warna: "#5CA935", // Hijau
        latar: "#EEF7E8",
    },
];

export function AboutSection() {
    return (
        <section id="tentang" className="relative isolate overflow-hidden bg-white">
            {/* Cahaya ambient — konsisten dengan section putih lain */}
            <div className="pointer-events-none absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-leaf-soft/50 blur-3xl" />

            {/* PERBAIKAN MOBILE: padding vertikal & jarak antar blok dipangkas
                di HP (py-12, mt-8, gap-3) supaya nggak kerasa renggang */}
            <div className="relative mx-auto w-full max-w-[1700px] px-5 py-12 sm:px-8 sm:py-20 lg:px-16">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="max-w-2xl"
                >
                    <span className="inline-flex items-center gap-2 rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-teal-dark">
                        <GraduationCap size={13} />
                        Tentang Kami
                    </span>

                    <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-soil sm:mt-4 sm:text-3xl md:text-4xl">
                        Berawal dari satu hal yang
                        <br className="hidden sm:block" />{" "}
                        <span className="text-teal-dark">kami lihat sendiri</span>
                    </h2>
                </motion.div>

                <div className="mt-6 grid gap-3 sm:mt-12 sm:gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
                    <div className="flex flex-col gap-3 sm:gap-4">
                        {cerita.map((c, i) => {
                            const Icon = c.icon;

                            return (
                                <motion.div
                                    key={c.judul}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-60px" }}
                                    transition={{ duration: 0.45, delay: i * 0.1 }}
                                    className="group flex gap-3 rounded-2xl border border-ink/5 bg-cream p-4 transition-all hover:border-transparent hover:bg-white hover:shadow-lg hover:shadow-soil/5 sm:gap-4 sm:p-6"
                                >
                                    <span
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 sm:h-11 sm:w-11 sm:rounded-xl"
                                        style={{ backgroundColor: c.latar, color: c.warna }}
                                    >
                                        <Icon size={17} strokeWidth={1.75} className="sm:hidden" />
                                        <Icon size={19} strokeWidth={1.75} className="hidden sm:block" />
                                    </span>

                                    <div className="min-w-0">
                                        <h3 className="font-display text-[14px] font-bold text-soil sm:text-base">
                                            {c.judul}
                                        </h3>
                                        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft sm:mt-1.5 sm:text-sm">
                                            {c.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16241B] via-[#1F4D33] to-[#0B5F7D] p-5 text-white sm:rounded-3xl sm:p-7 lg:p-8"
                    >
                        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute -bottom-20 -left-14 h-48 w-48 rounded-full bg-leaf/10" />

                        <div className="relative">
                            <Quote size={22} className="text-white/20 sm:hidden" />
                            <Quote size={26} className="hidden text-white/20 sm:block" />

                            <p className="mt-2.5 font-display text-base font-semibold leading-snug sm:mt-3 sm:text-lg">
                                &ldquo;Kalau petani dan pemilik warung sama-sama untung, rantainya baru
                                benar-benar kuat.&rdquo;
                            </p>

                            <div className="mt-5 border-t border-white/15 pt-4 sm:mt-7 sm:pt-6">
                                <div className="text-xs font-medium text-white/60">Diusulkan oleh</div>
                                <h3 className="mt-1 font-display text-base font-bold sm:text-lg">Tim Titip Absen</h3>
                                <p className="mt-0.5 text-[13px] text-white/70 sm:text-sm">
                                    Politeknik Negeri Lhokseumawe D-IV Teknik Informatika
                                </p>
                            </div>

                            <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:gap-2.5">
                                {tim.map((t) => (
                                    <div
                                        key={t.nim}
                                        className="flex items-center gap-2.5 rounded-xl bg-white/10 p-2.5 transition-colors hover:bg-white/15 sm:gap-3 sm:p-3"
                                    >
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 font-display text-[13px] font-bold sm:h-9 sm:w-9 sm:text-sm">
                                            {t.nama.charAt(0)}
                                        </span>

                                        <div className="min-w-0">
                                            <div className="truncate text-[13px] font-semibold sm:text-sm">{t.nama}</div>
                                            <div className="font-data text-[10px] text-white/55 sm:text-[11px]">
                                                {t.peran} · {t.nim}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex items-start gap-2 rounded-xl bg-white/[0.07] p-3 sm:mt-6 sm:p-3.5">
                                <Trophy size={15} className="mt-0.5 shrink-0 text-leaf" />
                                <p className="text-[10.5px] leading-relaxed text-white/65 sm:text-[11px]">
                                    Disusun untuk Kompetisi Mahasiswa Informatika Politeknik Nasional VIII
                                    2026, bidang Perencanaan Bisnis TIK.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}