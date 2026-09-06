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
            <div className="relative mx-auto w-full max-w-[1700px] px-5 py-6 sm:px-8 sm:py-14 lg:px-16">
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

                    <h2 className="mt-2.5 font-display text-xl font-bold leading-tight text-soil sm:mt-4 sm:text-3xl md:text-4xl">
                        Berawal dari satu hal yang
                        <br className="hidden sm:block" />{" "}
                        <span className="text-teal-dark">kami lihat sendiri</span>
                    </h2>
                </motion.div>

                <div className="mt-5 grid gap-2.5 sm:mt-12 sm:gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
                    <div className="flex flex-col gap-2.5 sm:gap-4">
                        {cerita.map((c, i) => {
                            const Icon = c.icon;

                            return (
                                <motion.div
                                    key={c.judul}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-60px" }}
                                    transition={{ duration: 0.45, delay: i * 0.1 }}
                                    className="group flex gap-2.5 rounded-xl border border-ink/5 bg-cream p-3 transition-all hover:border-transparent hover:bg-white hover:shadow-lg hover:shadow-soil/5 sm:gap-4 sm:rounded-2xl sm:p-6"
                                >
                                    <span
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 sm:h-11 sm:w-11 sm:rounded-xl"
                                        style={{ backgroundColor: c.latar, color: c.warna }}
                                    >
                                        <Icon size={13} strokeWidth={1.75} className="sm:hidden" />
                                        <Icon size={19} strokeWidth={1.75} className="hidden sm:block" />
                                    </span>

                                    <div className="min-w-0">
                                        <h3 className="font-display text-[13px] font-bold text-soil sm:text-base">
                                            {c.judul}
                                        </h3>
                                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-soft sm:mt-1.5 sm:text-sm">
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
                        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#16241B] via-[#1F4D33] to-[#0B5F7D] p-4 text-white sm:rounded-3xl sm:p-7 lg:p-8"
                    >
                        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute -bottom-20 -left-14 h-48 w-48 rounded-full bg-leaf/10" />

                        <div className="relative">
                            <Quote size={16} className="text-white/20 sm:hidden" />
                            <Quote size={26} className="hidden text-white/20 sm:block" />

                            <p className="mt-2 font-display text-[13.5px] font-semibold leading-snug sm:mt-3 sm:text-lg">
                                &ldquo;Kalau petani dan pemilik warung sama-sama untung, rantainya baru
                                benar-benar kuat.&rdquo;
                            </p>

                            <div className="mt-3.5 border-t border-white/15 pt-3 sm:mt-7 sm:pt-6">
                                <div className="text-[10.5px] font-medium text-white/60 sm:text-xs">Diusulkan oleh</div>
                                <h3 className="mt-0.5 font-display text-[13.5px] font-bold sm:mt-1 sm:text-lg">Tim Titip Absen</h3>
                                <p className="mt-0.5 text-[11px] text-white/70 sm:text-sm">
                                    Politeknik Negeri Lhokseumawe D-IV Teknik Informatika
                                </p>
                            </div>

                            <div className="mt-3 flex flex-col gap-1.5 sm:mt-5 sm:gap-2.5">
                                {tim.map((t) => (
                                    <div
                                        key={t.nim}
                                        className="flex items-center gap-2 rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/15 sm:gap-3 sm:rounded-xl sm:p-3"
                                    >
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 font-display text-[10px] font-bold sm:h-9 sm:w-9 sm:text-sm">
                                            {t.nama.charAt(0)}
                                        </span>

                                        <div className="min-w-0">
                                            <div className="truncate text-[11.5px] font-semibold sm:text-sm">{t.nama}</div>
                                            <div className="font-data text-[9.5px] text-white/55 sm:text-[11px]">
                                                {t.peran} · {t.nim}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-white/[0.07] p-2.5 sm:mt-6 sm:gap-2 sm:rounded-xl sm:p-3.5">
                                <Trophy size={13} className="mt-0.5 shrink-0 text-leaf" />
                                <p className="text-[9.5px] leading-relaxed text-white/65 sm:text-[11px]">
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