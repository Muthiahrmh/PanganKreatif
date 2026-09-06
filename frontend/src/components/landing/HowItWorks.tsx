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

const gayaPeran: Record<string, { warna: string; latar: string; gradasiKanan: string }> = {
    UMKM: { warna: "#2563EB", latar: "#EFF6FF", gradasiKanan: "from-[#0B1220] via-[#1E3A8A] to-[#2563EB]" },
    Sistem: { warna: "#5CA935", latar: "#EEF7E8", gradasiKanan: "from-[#16241B] via-[#1F4D33] to-[#5CA935]" },
    Pemasok: { warna: "#3E7D22", latar: "#EEF7E8", gradasiKanan: "from-[#16241B] via-[#1F4D33] to-[#3E7D22]" },
};

export function HowItWorks() {
    const [aktif, setAktif] = useState(0);

    const handleDragEnd = (e: any, { offset }: any) => {
        const batasGeser = 50;
        if (offset.x < -batasGeser && aktif < langkah.length - 1) {
            setAktif(aktif + 1);
        } else if (offset.x > batasGeser && aktif > 0) {
            setAktif(aktif - 1);
        }
    };

    return (
        <section id="cara-kerja" className="bg-pola-tani-halus">
            {/* PERBAIKAN MOBILE: padding & jarak HP dipangkas lebih jauh (py-12, mt-6, gap-6) */}
            <div className="mx-auto w-full max-w-[1700px] px-5 py-9 sm:px-8 sm:py-16 lg:px-16 lg:py-20">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="max-w-2xl"
                >
                    <span className="inline-flex rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-teal-dark">
                        Cara Kerja
                    </span>

                    <h2 className="mt-2.5 font-display text-xl font-bold leading-tight text-soil sm:mt-4 sm:text-3xl md:text-4xl">
                        Enam langkah, dari catatan
                        <br className="hidden sm:block" />{" "}
                        <span className="text-teal-dark">sampai barang tiba</span>
                    </h2>

                    <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-soft sm:mt-4 sm:text-[15px] lg:text-base">
                        Klik tiap langkah atau geser kartu untuk melihat penjelasannya.
                    </p>
                </motion.div>

                {/* PERBAIKAN UTAMA: Pakai flex-col-reverse di HP supaya KARTU di atas, DAFTAR di bawah */}
                <div className="mt-5 flex flex-col-reverse gap-4 sm:mt-10 sm:gap-10 lg:mt-12 lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-14">

                    {/* Garis waktu kiri (Di HP pindah ke bawah) */}
                    <div className="relative">
                        <div className="absolute bottom-4 left-[1.4rem] top-4 w-px bg-ink/10 hidden sm:block" />

                        <div className="flex flex-col gap-1 lg:gap-1">
                            {langkah.map((l, i) => {
                                const Icon = l.icon;
                                const gaya = gayaPeran[l.peran];
                                const ini = aktif === i;

                                return (
                                    <button
                                        key={l.judul}
                                        onClick={() => setAktif(i)}
                                        className={`relative flex items-center gap-2.5 rounded-lg sm:gap-4 sm:rounded-2xl sm:items-start p-2 sm:p-3 text-left transition-colors ${ini ? "bg-white shadow-sm ring-1 ring-ink/5" : "hover:bg-white/60"
                                            }`}
                                    >
                                        <span
                                            className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-md sm:h-11 sm:w-11 sm:rounded-xl transition-all ${ini ? "scale-105" : ""
                                                }`}
                                            style={{
                                                backgroundColor: ini ? gaya.warna : gaya.latar,
                                                color: ini ? "#FFFFFF" : gaya.warna,
                                            }}
                                        >
                                            <Icon size={11} strokeWidth={1.75} className="sm:hidden" />
                                            <Icon size={19} strokeWidth={1.75} className="hidden sm:block" />
                                        </span>

                                        <div className="min-w-0 sm:pt-0.5">
                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                <span className="font-mono text-[9px] text-ink-soft sm:text-[11px]">
                                                    {String(i + 1).padStart(2, "0")}
                                                </span>
                                                <span className={`font-display text-[12px] sm:text-[15px] font-bold transition-colors ${ini ? "text-soil" : "text-ink"}`}>
                                                    {l.judul}
                                                </span>
                                            </div>
                                            {/* Deskripsi lengkap disembunyikan di HP — sudah terwakili
                                                di kartu detail atasnya, jadi daftar 6 langkah ini di HP
                                                cukup judul singkat saja biar nggak makan tempat. */}
                                            <p className="mt-1 hidden text-[13px] leading-relaxed text-ink-soft sm:block">
                                                {l.desc}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Panel kanan dinamis (Di HP otomatis naik ke atas) */}
                    <div className="lg:sticky lg:top-28 lg:self-start">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={aktif}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={handleDragEnd}
                                className={`cursor-grab active:cursor-grabbing overflow-hidden rounded-xl sm:rounded-3xl bg-gradient-to-br ${gayaPeran[langkah[aktif].peran].gradasiKanan} p-4 sm:p-8 text-white shadow-xl`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-medium sm:px-3 sm:py-1 sm:text-xs">
                                        {langkah[aktif].peran}
                                    </span>
                                    <span className="font-display text-xl sm:text-4xl font-bold text-white/20">
                                        {String(aktif + 1).padStart(2, "0")}
                                    </span>
                                </div>

                                <h3 className="mt-3 font-display text-base font-bold sm:mt-5 sm:text-xl lg:text-2xl">
                                    {langkah[aktif].judul}
                                </h3>

                                <p className="mt-2 text-[12px] leading-relaxed text-white/80 pointer-events-none sm:mt-3 sm:text-[14px]">
                                    {langkah[aktif].desc}
                                </p>

                                <div className="mt-3 rounded-xl bg-white/10 p-3 backdrop-blur pointer-events-none sm:mt-6 sm:rounded-2xl sm:p-4">
                                    <p className="text-[11.5px] sm:text-sm leading-relaxed text-white/90">
                                        {langkah[aktif].detail}
                                    </p>
                                </div>

                                {/* Titik indikator */}
                                <div className="mt-3 flex gap-1.5 justify-center sm:mt-6 lg:justify-start">
                                    {langkah.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setAktif(i)}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${i === aktif ? "w-8 bg-white" : "w-4 bg-white/30 hover:bg-white/50"
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