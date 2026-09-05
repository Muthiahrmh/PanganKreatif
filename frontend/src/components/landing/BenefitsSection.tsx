"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Store,
    Sprout,
    TrendingDown,
    Trash2,
    Scale,
    Truck,
    BarChart3,
    HandCoins,
    Receipt,
    CalendarClock,
} from "lucide-react";

/**
 * Manfaat, dipisah per peran.
 *
 * Yang menguntungkan UMKM belum tentu sama dengan yang menguntungkan
 * kelompok tani. Menyatukannya jadi satu daftar membuat pembaca harus
 * memilah sendiri mana yang relevan untuknya.
 *
 * Angka pada tiap poin berasal dari perhitungan sistem, bukan klaim
 * pemasaran — misalnya selisih harga grosir pada data katalog.
 */
const isi = {
    umkm: {
        label: "UMKM Kuliner",
        sub: "Warung, kafe, katering, rumah makan",
        icon: Store,
        warna: "#2563EB", // Biru UMKM
        latar: "#EFF6FF", // Biru muda
        gradasi: "from-[#0B1220] via-[#1E3A8A] to-[#2563EB]", // Gradasi Auth UMKM
        // Dibuat sebagai perbandingan harga konkret (bukan cuma angka
        // "hemat" yang mengambang) supaya jelas 297rb itu selisih dari
        // apa — dicontohkan dari pembelian Cabai Merah 66 kg, angka yang
        // sama dipakai di cuplikan PhoneMockup supaya konsisten.
        sorot: {
            jenis: "banding" as const,
            label: "Contoh Perhitungan · Cabai Merah 66 kg",
            barisA: { nama: "Beli sendiri-sendiri", nilai: "Rp2.970.000" },
            barisB: { nama: "Belanja kolektif", nilai: "Rp2.673.000" },
            hasil: { label: "Selisih hemat", nilai: "Rp297rb", sub: "10%" },
        },
        poin: [
            // Poin-poin tetap sama
            {
                icon: TrendingDown,
                judul: "Harga bahan baku lebih murah",
                desc: "Pembelian bersama membuat kuota grosir tercapai, sehingga harga per satuan turun dibanding membeli sendiri.",
            },
            {
                icon: Trash2,
                judul: "Bahan tidak terbuang",
                desc: "Prediksi kebutuhan membantu membeli sesuai perkiraan pemakaian, bukan berdasarkan tebakan.",
            },
            {
                icon: Scale,
                judul: "Bisa membandingkan pemasok",
                desc: "Harga, stok, jarak, dan estimasi pengiriman dari beberapa pemasok terlihat berdampingan.",
            },
            {
                icon: BarChart3,
                judul: "Tahu pola bisnis sendiri",
                desc: "Riwayat penjualan memperlihatkan bulan ramai dan sepi, termasuk lonjakan menjelang Meugang dan hari raya.",
            },
        ],
    },
    tani: {
        // Objek Tani dibiarkan tetap sama (sudah hijau)
        label: "Kelompok Tani & Distributor",
        sub: "Petani, nelayan, koperasi, pemasok bahan baku",
        icon: Sprout,
        warna: "#3E7D22",
        latar: "#EEF7E8",
        gradasi: "from-[#16241B] via-[#3E7D22] to-[#5CA935]",
        // Sama polanya dengan sisi UMKM — dibikin perbandingan konkret
        // (bukan cuma "1 kirim" yang mengambang) supaya jelas untungnya
        // di mana: ongkos angkut yang tadinya ditanggung sendiri per
        // pengiriman, sekarang dibagi rame-rame ke UMKM yang gabung.
        sorot: {
            jenis: "banding" as const,
            label: "Contoh Perhitungan · 5 UMKM Pesan Bahan Sama",
            barisA: { nama: "Kirim sendiri-sendiri", nilai: "5× pengiriman" },
            barisB: { nama: "Digabung PanganKreatif", nilai: "1× pengiriman" },
            hasil: { label: "Ongkos angkut", nilai: "Dibagi 5 UMKM", sub: "bukan ditanggung sendiri" },
        },
        poin: [
            // Poin-poin tetap sama...
            {
                icon: HandCoins,
                judul: "Pesanan lebih besar dan pasti",
                desc: "Permintaan beberapa UMKM terkumpul jadi satu pesanan, bukan pesanan kecil yang terpisah-pisah.",
            },
            {
                icon: Truck,
                judul: "Ongkos kirim lebih efisien",
                desc: "Satu pengiriman melayani beberapa pembeli, sehingga biaya angkut per satuan lebih ringan.",
            },
            {
                icon: BarChart3,
                judul: "Tahu apa yang sedang dicari",
                desc: "Dashboard menampilkan komoditas yang paling banyak diminta UMKM, termasuk yang belum kamu pasok.",
            },
            {
                icon: Receipt,
                judul: "Pembayaran transparan",
                desc: "Potongan ditampilkan terbuka, dan penerusan dana disertai bukti transfer yang bisa kamu periksa.",
            },
        ],
    },
};

type Peran = keyof typeof isi;

export function BenefitsSection() {
    const [peran, setPeran] = useState<Peran>("umkm");
    const d = isi[peran];
    const IkonPeran = d.icon;

    return (
        <section id="manfaat" className="bg-pola-tani-halus">
            <div className="mx-auto w-full max-w-[1700px] px-6 py-20 sm:px-8 lg:px-16">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <span className="inline-flex rounded-full bg-leaf-soft px-3 py-1 text-xs font-semibold text-leaf-dark">
                        Manfaat
                    </span>

                    <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-soil md:text-4xl">
                        Menguntungkan <span className="text-leaf-dark">kedua ujung</span> rantai
                    </h2>

                    <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
                        Rantai pasok hanya kuat kalau pembeli di hilir dan penghasil di hulu sama-sama
                        diuntungkan.
                    </p>
                </motion.div>

                {/* Pemilih peran */}
                <div className="mt-8 flex justify-center">
                    <div className="inline-flex rounded-full bg-white p-1 shadow-sm">
                        {(Object.keys(isi) as Peran[]).map((k) => {
                            const Ikon = isi[k].icon;
                            const ini = peran === k;

                            return (
                                <button
                                    key={k}
                                    onClick={() => setPeran(k)}
                                    className="relative inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors sm:px-6"
                                    style={{ color: ini ? "#FFFFFF" : "#64748B" }}
                                >
                                    {ini && (
                                        <motion.span
                                            layoutId="pemilih-manfaat"
                                            className="absolute inset-0 rounded-full"
                                            style={{ backgroundColor: isi[k].warna }}
                                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                        />
                                    )}

                                    <span className="relative z-10 flex items-center gap-2">
                                        <Ikon size={15} />
                                        {k === "umkm" ? "UMKM Kuliner" : "Kelompok Tani"}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={peran}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="mt-10 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]"
                    >
                        {/* Panel identitas peran */}
                        <div
                            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${d.gradasi} p-8 text-white`}
                        >
                            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
                            <div className="pointer-events-none absolute -bottom-20 -left-14 h-48 w-48 rounded-full bg-white/5" />

                            <div className="relative">
                                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 backdrop-blur">
                                    <IkonPeran size={26} strokeWidth={1.6} />
                                </span>

                                <h3 className="mt-6 font-display text-xl font-bold lg:text-2xl">
                                    {d.label}
                                </h3>
                                <p className="mt-1.5 text-sm text-white/70">{d.sub}</p>

                                <div className="mt-8 rounded-2xl bg-white/10 p-5 backdrop-blur">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/55">
                                        {d.sorot.label}
                                    </div>

                                    {/* Perbandingan "tanpa vs dengan PanganKreatif" — supaya
                                        angka hasilnya kelihatan jelas selisih dari mana, bukan
                                        angka mengambang yang bisa disalahartikan sebagai diskon. */}
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-white/60">{d.sorot.barisA.nama}</span>
                                            <span className="font-medium text-white/60 line-through decoration-white/30">
                                                {d.sorot.barisA.nilai}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 flex items-center justify-between text-sm">
                                            <span className="font-semibold text-white/90">{d.sorot.barisB.nama}</span>
                                            <span className="font-display text-lg font-bold text-white">
                                                {d.sorot.barisB.nilai}
                                            </span>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between rounded-xl bg-white/10 px-3 py-2">
                                            <span className="text-xs font-semibold text-white/80">{d.sorot.hasil.label}</span>
                                            <span className="text-right font-display text-base font-bold text-leaf">
                                                {d.sorot.hasil.nilai}
                                                {d.sorot.hasil.sub && (
                                                    <span className="ml-1 text-xs font-semibold text-leaf/80">
                                                        ({d.sorot.hasil.sub})
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center gap-2 text-xs text-white/60">
                                    <CalendarClock size={13} />
                                    Terasa sejak transaksi pertama
                                </div>
                            </div>
                        </div>

                        {/* Daftar manfaat */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            {d.poin.map((p, i) => {
                                const Icon = p.icon;

                                return (
                                    <motion.div
                                        key={p.judul}
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, delay: i * 0.07 }}
                                        className="group rounded-2xl border border-ink/5 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-soil/5"
                                    >
                                        <span
                                            className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                                            style={{ backgroundColor: d.latar, color: d.warna }}
                                        >
                                            <Icon size={18} strokeWidth={1.75} />
                                        </span>

                                        <h4 className="mt-4 font-display text-sm font-bold text-soil">
                                            {p.judul}
                                        </h4>

                                        <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                                            {p.desc}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}