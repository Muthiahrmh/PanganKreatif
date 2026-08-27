"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    NotebookPen,
    BrainCircuit,
    Lightbulb,
    Users,
    Sprout,
    Truck,
} from "lucide-react";

const langkah = [
    {
        icon: NotebookPen,
        judul: "Catat Penjualan Harian",
        desc: "UMKM mencatat bahan baku yang terpakai setiap hari. Semakin panjang riwayatnya, semakin akurat prediksinya.",
        peran: "UMKM",
        detail: "Cukup nama bahan, jumlah, dan tanggal. Bisa dicatat sambil melayani pembeli.",
    },
    {
        icon: BrainCircuit,
        judul: "Sistem Memprediksi Kebutuhan",
        desc: "Riwayat diolah dengan rata-rata bergerak, tren, pola musiman, dan hari libur nasional.",
        peran: "Sistem",
        detail: "Setiap komponen perhitungan ditampilkan terpisah, jadi kamu tahu angkanya dari mana.",
    },
    {
        icon: Lightbulb,
        judul: "Rekomendasi Pembelian",
        desc: "Muncul saran berapa yang perlu dibeli, dari pemasok mana yang termurah, dan berapa potensi hematnya.",
        peran: "Sistem",
        detail: "Jarak dan estimasi pengiriman ikut dipertimbangkan, bukan cuma harga.",
    },
    {
        icon: Users,
        judul: "Belanja Kolektif",
        desc: "Beberapa UMKM bergabung dalam satu pesanan. Kuota tercapai, harga grosir aktif untuk semua peserta.",
        peran: "UMKM",
        detail: "Termasuk yang bergabung lebih dulu — harga turun untuk semua, bukan hanya yang terakhir.",
    },
    {
        icon: Sprout,
        judul: "Kelompok Tani Menerima",
        desc: "Pemasok melihat permintaan yang sudah terkumpul dari beberapa UMKM sekaligus.",
        peran: "Pemasok",
        detail: "Satu pesanan besar lebih mudah disiapkan daripada belasan pesanan kecil terpisah.",
    },
    {
        icon: Truck,
        judul: "Kirim dan Terusan Dana",
        desc: "Barang dikirim dalam satu pengiriman. Dana diteruskan setelah dipotong komisi, disertai bukti transfer.",
        peran: "Pemasok",
        detail: "Pemasok bisa memeriksa sendiri bukti transfernya di halaman Pembayaran.",
    },
];

// Pengaturan warna interaktif, panel kanan akan berubah sesuai peran yang diklik
const gayaPeran: Record<string, { warna: string; latar: string; gradasiKanan: string }> = {
    UMKM: {
        warna: "#2563EB", // Biru
        latar: "#EFF6FF",
        gradasiKanan: "from-[#0B1220] via-[#1E3A8A] to-[#2563EB]"
    },
    Sistem: {
        warna: "#5CA935", // Hijau Terang
        latar: "#EEF7E8",
        gradasiKanan: "from-[#16241B] via-[#1F4D33] to-[#5CA935]"
    },
    Pemasok: {
        warna: "#3E7D22", // Hijau Tua
        latar: "#EEF7E8",
        gradasiKanan: "from-[#16241B] via-[#1F4D33] to-[#3E7D22]"
    },
};

export function HowItWorks() {
    const [aktif, setAktif] = useState(0);

    return (
        <section id="cara-kerja" className="bg-cream">
            <div className="mx-auto w-full max-w-[1700px] px-6 py-20 sm:px-8 lg:px-16">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="max-w-2xl"
                >
                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-blue">
                        Cara Kerja
                    </span>

                    <h2 className="mt-4 font-display text-2xl font-bold leading-tight text-soil md:text-4xl">
                        Enam langkah, dari catatan
                        <br className="hidden sm:block" />{" "}
                        <span className="text-brand-blue">sampai barang tiba</span>
                    </h2>

                    <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
                        Klik tiap langkah untuk melihat penjelasannya.
                    </p>
                </motion.div>

                <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
                    {/* Garis waktu kiri */}
                    <div className="relative">
                        <div className="absolute bottom-4 left-[1.4rem] top-4 w-px bg-ink/10" />

                        <div className="flex flex-col gap-1">
                            {langkah.map((l, i) => {
                                const Icon = l.icon;
                                const gaya = gayaPeran[l.peran];
                                const ini = aktif === i;

                                return (
                                    <button
                                        key={l.judul}
                                        onClick={() => setAktif(i)}
                                        className={`relative flex items-start gap-4 rounded-2xl p-3 text-left transition-colors ${ini ? "bg-white shadow-sm" : "hover:bg-white/60"
                                            }`}
                                    >
                                        <span
                                            className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${ini ? "scale-105" : ""
                                                }`}
                                            style={{
                                                backgroundColor: ini ? gaya.warna : gaya.latar,
                                                color: ini ? "#FFFFFF" : gaya.warna,
                                            }}
                                        >
                                            <Icon size={19} strokeWidth={1.75} />
                                        </span>

                                        <div className="min-w-0 pt-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-[11px] text-ink-soft">
                                                    {String(i + 1).padStart(2, "0")}
                                                </span>

                                                <span
                                                    className={`font-display text-sm font-bold transition-colors ${ini ? "text-soil" : "text-ink"
                                                        }`}
                                                >
                                                    {l.judul}
                                                </span>
                                            </div>

                                            <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                                                {l.desc}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Panel kanan dinamis */}
                    <div className="lg:sticky lg:top-28 lg:self-start">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={aktif}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className={`overflow-hidden rounded-3xl bg-gradient-to-br ${gayaPeran[langkah[aktif].peran].gradasiKanan} p-8 text-white shadow-xl transition-all duration-500`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                                        {langkah[aktif].peran}
                                    </span>

                                    <span className="font-display text-4xl font-bold text-white/20">
                                        {String(aktif + 1).padStart(2, "0")}
                                    </span>
                                </div>

                                <h3 className="mt-5 font-display text-xl font-bold lg:text-2xl">
                                    {langkah[aktif].judul}
                                </h3>

                                <p className="mt-3 text-sm leading-relaxed text-white/80">
                                    {langkah[aktif].desc}
                                </p>

                                <div className="mt-6 rounded-2xl bg-white/10 p-4 backdrop-blur">
                                    <p className="text-sm leading-relaxed text-white/90">
                                        {langkah[aktif].detail}
                                    </p>
                                </div>

                                {/* Titik indikator */}
                                <div className="mt-6 flex gap-1.5">
                                    {langkah.map((_, i) => (
                                        <span
                                            key={i}
                                            className={`h-1 rounded-full transition-all duration-300 ${i === aktif ? "w-8 bg-white" : "w-4 bg-white/30"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}