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
        desc: "Pemilik warung menebak kebutuhan bahan baku dari ingatan, lalu membeli satuan dengan harga jauh di atas harga grosir. Di sisi lain, kelompok tani menjual kecil-kecil ke banyak pembeli terpisah, dan ongkos kirimnya menggerus keuntungan.",
        warna: "#2563EB", // Biru lembut
        latar: "#EFF6FF",
    },
    {
        icon: Lightbulb,
        judul: "Cara kami menjawabnya",
        desc: "Riwayat penjualan diolah jadi perkiraan kebutuhan, lalu beberapa UMKM digabungkan dalam satu pesanan supaya kuota grosir tercapai. Satu pengiriman melayani banyak pembeli, dan harga per satuan turun untuk semua.",
        warna: "#159B87", // Teal
        latar: "#E6F4F1",
    },
    {
        icon: MapPin,
        judul: "Kenapa mulai dari Aceh",
        desc: "Kami tinggal di Lhokseumawe dan melihat sendiri masalahnya. Model prediksinya pun memperhitungkan hal yang khas di sini sepeti lonjakan menjelang Meugang, musim kopi di dataran tinggi Gayo, dan cuaca yang memengaruhi hasil tangkapan.",
        warna: "#5CA935", // Hijau
        latar: "#EEF7E8",
    },
];

export function AboutSection() {
    return (
        <section id="tentang" className="bg-white">
            <div className="mx-auto w-full max-w-[1700px] px-6 py-20 sm:px-8 lg:px-16">
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

                    <h2 className="mt-4 font-display text-2xl font-bold leading-tight text-soil md:text-4xl">
                        Berawal dari satu hal yang
                        <br className="hidden sm:block" />{" "}
                        <span className="text-teal-dark">kami lihat sendiri</span>
                    </h2>
                </motion.div>

                <div className="mt-12 grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
                    <div className="flex flex-col gap-4">
                        {cerita.map((c, i) => {
                            const Icon = c.icon;

                            return (
                                <motion.div
                                    key={c.judul}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-60px" }}
                                    transition={{ duration: 0.45, delay: i * 0.1 }}
                                    className="group flex gap-4 rounded-2xl border border-ink/5 bg-cream p-5 transition-all hover:border-transparent hover:bg-white hover:shadow-lg hover:shadow-soil/5 sm:p-6"
                                >
                                    <span
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                                        style={{ backgroundColor: c.latar, color: c.warna }}
                                    >
                                        <Icon size={19} strokeWidth={1.75} />
                                    </span>

                                    <div className="min-w-0">
                                        <h3 className="font-display text-base font-bold text-soil">
                                            {c.judul}
                                        </h3>
                                        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
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
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16241B] via-[#1F4D33] to-[#0E7A6B] p-7 text-white lg:p-8"
                    >
                        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute -bottom-20 -left-14 h-48 w-48 rounded-full bg-leaf/10" />

                        <div className="relative">
                            <Quote size={26} className="text-white/20" />

                            <p className="mt-3 font-display text-lg font-semibold leading-snug">
                                &ldquo;Kalau petani dan pemilik warung sama-sama untung, rantainya baru
                                benar-benar kuat.&rdquo;
                            </p>

                            <div className="mt-7 border-t border-white/15 pt-6">
                                <div className="text-xs font-medium text-white/60">Diusulkan oleh</div>
                                <h3 className="mt-1 font-display text-lg font-bold">Tim Titip Absen</h3>
                                <p className="mt-0.5 text-sm text-white/70">
                                    Politeknik Negeri Lhokseumawe D-IV Teknik Informatika
                                </p>
                            </div>

                            <div className="mt-5 flex flex-col gap-2.5">
                                {tim.map((t) => (
                                    <div
                                        key={t.nim}
                                        className="flex items-center gap-3 rounded-xl bg-white/10 p-3 transition-colors hover:bg-white/15"
                                    >
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 font-display text-sm font-bold">
                                            {t.nama.charAt(0)}
                                        </span>

                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold">{t.nama}</div>
                                            <div className="font-data text-[11px] text-white/55">
                                                {t.peran} · {t.nim}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex items-start gap-2 rounded-xl bg-white/[0.07] p-3.5">
                                <Trophy size={15} className="mt-0.5 shrink-0 text-leaf" />
                                <p className="text-[11px] leading-relaxed text-white/65">
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