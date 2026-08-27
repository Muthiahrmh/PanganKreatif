"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    MessageCircle,
    Mail,
    MapPin,
    Clock,
    ChevronDown,
    Store,
    Sprout,
    HelpCircle,
    Search,
    Headset,
    ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

/**
 * Halaman bantuan.
 *
 * Mendukung pendekatan pendampingan langsung pada Bab III proposal:
 * UMKM kuliner dan kelompok tani lebih percaya pada bantuan orang
 * daripada dokumen, jadi kontak manusia ditaruh paling atas dan
 * pertanyaan umum menyusul di bawahnya.
 *
 * Ubah nomor dan alamat di bawah sesuai kontak tim. Selaraskan juga
 * dengan ContactSection di halaman depan.
 */
const KONTAK = {
    whatsapp: "6282165383828",
    whatsappTampil: "0821-6538-3828",
    email: "pangankreatif@gmail.com",
    alamat: "Politeknik Negeri Lhokseumawe, Aceh Utara",
    jam: "Senin–Sabtu, 08.00–17.00 WIB",
};

interface Tanya {
    tanya: string;
    jawab: string;
}

const UMUM: Tanya[] = [
    {
        tanya: "Apa itu PanganKreatif?",
        jawab: "Platform yang menghubungkan UMKM kuliner dengan kelompok tani dan distributor bahan baku. Sistem memprediksi kebutuhan bahan baku dari riwayat penjualan, lalu memungkinkan beberapa UMKM membeli bersama supaya mendapat harga grosir.",
    },
    {
        tanya: "Apakah gratis?",
        jawab: "Mendaftar dan memakai fitur pencatatan, prediksi, serta perbandingan pemasok tidak dipungut biaya. Platform mengambil komisi dari setiap transaksi yang berhasil, dan besarnya sudah termasuk dalam harga yang tertera.",
    },
    {
        tanya: "Kenapa harus verifikasi email?",
        jawab: "Supaya kami bisa memastikan akun benar-benar milikmu dan mengirimkan pemberitahuan penting soal pesanan. Tautan verifikasi berlaku 5 menit; kalau lewat, minta kirim ulang dari halaman verifikasi.",
    },
    {
        tanya: "Saya lupa password, bagaimana?",
        jawab: "Untuk sekarang hubungi kami lewat WhatsApp dengan menyebutkan email yang terdaftar. Pemulihan password mandiri sedang disiapkan.",
    },
    {
        tanya: "Bisa dibuka dari HP?",
        jawab: "Bisa. Buka alamatnya di peramban HP, lalu pasang ke layar utama — di Android akan muncul tawaran otomatis, di iPhone lewat tombol Share pilih Add to Home Screen. Setelah terpasang, tampilannya layar penuh seperti aplikasi biasa.",
    },
];

const UMKM: Tanya[] = [
    {
        tanya: "Kenapa prediksi saya belum muncul?",
        jawab: "Prediksi dihitung dari riwayat penjualan. Catat dulu penjualan harian di menu Riwayat Penjualan, minimal beberapa bulan supaya polanya terbaca. Semakin panjang riwayatnya, semakin akurat hasilnya.",
    },
    {
        tanya: "Bagaimana harga grosir bisa aktif?",
        jawab: "Pemasok menetapkan jumlah minimal untuk harga grosir. Ketika total pesanan dari seluruh UMKM yang bergabung mencapai jumlah itu, harga otomatis turun untuk semua peserta — termasuk yang bergabung lebih dulu.",
    },
    {
        tanya: "Kenapa prediksi menyarankan mengurangi pembelian?",
        jawab: "Sistem membandingkan perkiraan kebutuhan bulan depan dengan rata-rata tiga bulan terakhir. Kalau lebih rendah, kamu disarankan menahan pembelian supaya tidak ada bahan yang terbuang.",
    },
    {
        tanya: "Setelah bayar, kapan pesanan dikirim?",
        jawab: "Pemasok memeriksa pembayaran lebih dulu, lalu menutup pesanan setelah batas waktu bergabung lewat, baru mengirim. Statusnya bisa kamu pantau di menu Transaksi.",
    },
    {
        tanya: "Apa maksud faktor musiman dan hari libur?",
        jawab: "Selain tren, sistem melihat apakah bulan tertentu biasanya lebih ramai bagi usahamu. Faktor musiman aktif setelah ada 24 bulan data, sedangkan faktor hari libur dipelajari dari riwayatmu sendiri — kalau bulan berhari raya memang lebih ramai, angkanya ikut naik.",
    },
];

const PEMASOK: Tanya[] = [
    {
        tanya: "Kapan dana penjualan saya diteruskan?",
        jawab: "Pembayaran UMKM masuk lebih dulu ke rekening platform. Setelah dipotong komisi, sisanya diteruskan ke rekeningmu. Statusnya bisa dilihat di menu Pembayaran, lengkap dengan bukti transfernya.",
    },
    {
        tanya: "Kenapa dana yang saya terima lebih kecil?",
        jawab: "Ada dua potongan: komisi transaksi dan margin distribusi. Keduanya ditampilkan terpisah di setiap transaksi supaya kamu bisa memeriksanya sendiri.",
    },
    {
        tanya: "Kenapa saya harus mengisi rekening?",
        jawab: "Tanpa rekening, dana hasil penjualan tidak bisa diteruskan. Isi di menu Profil bagian Rekening Penerimaan Dana.",
    },
    {
        tanya: "Apa gunanya harga grosir?",
        jawab: "Harga grosir mendorong UMKM membeli dalam jumlah besar secara bersama-sama. Bagimu, satu pengiriman melayani beberapa pembeli sekaligus, sehingga ongkos angkut per satuan lebih murah.",
    },
    {
        tanya: "Bagaimana tahu komoditas yang sedang dicari?",
        jawab: "Di beranda ada panel permintaan yang menampilkan komoditas paling banyak diminta UMKM, termasuk yang belum kamu pasok. Itu bisa jadi petunjuk apa yang layak ditambahkan ke katalog.",
    },
];

function Akordeon({ daftar }: { daftar: Tanya[] }) {
    const [terbuka, setTerbuka] = useState<number | null>(0);

    return (
        <div className="flex flex-col gap-2.5">
            {daftar.map((t, i) => {
                const ini = terbuka === i;

                return (
                    <div
                        key={t.tanya}
                        className={`overflow-hidden rounded-2xl border transition-colors ${ini ? "border-leaf/25 bg-white" : "border-ink/5 bg-white"
                            }`}
                    >
                        <button
                            onClick={() => setTerbuka(ini ? null : i)}
                            aria-expanded={ini}
                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-cream"
                        >
                            <span className="flex items-center gap-3">
                                <span
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${ini
                                            ? "bg-leaf text-white"
                                            : "bg-leaf-soft text-leaf-dark"
                                        }`}
                                >
                                    {i + 1}
                                </span>

                                <span className="text-sm font-medium text-soil">
                                    {t.tanya}
                                </span>
                            </span>

                            <ChevronDown
                                size={16}
                                className={`shrink-0 text-ink-soft transition-transform ${ini ? "rotate-180" : ""
                                    }`}
                            />
                        </button>

                        <AnimatePresence initial={false}>
                            {ini && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.22, ease: "easeOut" }}
                                    className="overflow-hidden"
                                >
                                    <p className="border-t border-ink/5 px-5 py-4 pl-[3.75rem] text-sm leading-relaxed text-ink-soft">
                                        {t.jawab}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}

export default function BantuanPage() {
    const [tab, setTab] = useState<"umum" | "umkm" | "pemasok">("umum");
    const [cari, setCari] = useState("");

    // Halaman ini terbuka untuk umum, tapi kalau pengunjungnya sedang
    // masuk, tombol kembali harus mengantar ke dashboard — bukan ke
    // halaman depan, karena itu terasa seperti terlempar keluar akun
    const user = useAuthStore((s) => s.user);
    const hydrated = useAuthStore((s) => s.hydrated);

    const sudahMasuk = hydrated && Boolean(user);
    const tujuanKembali = sudahMasuk ? "/dashboard" : "/";
    const labelKembali = sudahMasuk ? "Kembali ke dashboard" : "Kembali ke beranda";

    const pesanWa = encodeURIComponent("Halo PanganKreatif, saya butuh bantuan terkait ");
    const waUrl = `https://wa.me/${KONTAK.whatsapp}?text=${pesanWa}`;

    const semua = { umum: UMUM, umkm: UMKM, pemasok: PEMASOK };

    // Kalau ada kata kunci, cari di seluruh kategori sekaligus —
    // orang yang bingung biasanya tidak tahu masuk kategori mana
    const kunci = cari.trim().toLowerCase();
    const daftar = kunci
        ? [...UMUM, ...UMKM, ...PEMASOK].filter(
            (t) =>
                t.tanya.toLowerCase().includes(kunci) ||
                t.jawab.toLowerCase().includes(kunci)
        )
        : semua[tab];

    return (
        <div className="min-h-screen bg-cream">
            <header className="sticky top-0 z-40 border-b border-ink/5 bg-white/85 backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3.5">
                    <Link href={tujuanKembali}>
                        <Image
                            src="/images/logo-pangankreatif.png"
                            alt="PanganKreatif"
                            width={180}
                            height={60}
                            className="h-auto w-32"
                        />
                    </Link>

                    <Link
                        href={tujuanKembali}
                        className="group inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white py-2 pl-3 pr-4 text-sm font-medium text-ink-soft shadow-sm transition-all hover:border-ink/20 hover:text-ink hover:shadow"
                    >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cream transition-transform group-hover:-translate-x-0.5">
                            <ArrowLeft size={13} />
                        </span>
                        <span className="hidden sm:inline">{labelKembali}</span>
                        <span className="sm:hidden">Kembali</span>
                    </Link>
                </div>
            </header>

            {/* Kepala halaman */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#16241B] via-[#1F4D33] to-[#0E7A6B] text-white">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-leaf/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-teal/15 blur-2xl" />

                <div className="relative mx-auto w-full max-w-5xl px-6 py-14 sm:py-16">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                        <Headset size={13} />
                        Pusat Bantuan
                    </span>

                    <h1 className="mt-4 font-display text-2xl font-bold leading-tight sm:text-4xl">
                        Ada yang bisa kami bantu?
                    </h1>

                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">
                        Cari jawabannya di bawah, atau hubungi kami langsung. Kami lebih
                        senang bicara daripada membiarkanmu menebak-nebak.
                    </p>

                    <div className="relative mt-7 max-w-xl">
                        <Search
                            size={17}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft"
                        />
                        <input
                            value={cari}
                            onChange={(e) => setCari(e.target.value)}
                            placeholder="Cari pertanyaan, misalnya harga grosir"
                            className="w-full rounded-full border-0 bg-white py-3.5 pl-11 pr-4 text-sm text-ink outline-none ring-2 ring-transparent transition placeholder:text-ink-soft/60 focus:ring-leaf"
                        />
                    </div>
                </div>
            </div>

            <main className="mx-auto w-full max-w-5xl px-6 py-12">
                {/* Kontak langsung ditaruh atas — banyak mitra kami lebih
                    nyaman bertanya lewat orang daripada membaca */}
                <div className="grid gap-3 sm:grid-cols-3">
                    <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-3.5 rounded-2xl border border-ink/5 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-leaf/30 hover:shadow-lg hover:shadow-soil/5"
                    >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-leaf-soft text-leaf-dark">
                            <MessageCircle size={19} />
                        </span>

                        <div className="min-w-0">
                            <div className="font-display text-sm font-bold text-soil">
                                WhatsApp
                            </div>
                            <div className="font-data text-xs text-ink-soft">
                                {KONTAK.whatsappTampil}
                            </div>
                        </div>

                        <ArrowRight
                            size={15}
                            className="ml-auto shrink-0 text-ink-soft/40 transition-transform group-hover:translate-x-0.5"
                        />
                    </a>

                    <a
                        href={`mailto:${KONTAK.email}`}
                        className="group flex items-center gap-3.5 rounded-2xl border border-ink/5 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-teal/30 hover:shadow-lg hover:shadow-soil/5"
                    >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-teal-dark">
                            <Mail size={19} />
                        </span>

                        <div className="min-w-0">
                            <div className="font-display text-sm font-bold text-soil">
                                Email
                            </div>
                            <div className="truncate text-xs text-ink-soft">
                                {KONTAK.email}
                            </div>
                        </div>

                        <ArrowRight
                            size={15}
                            className="ml-auto shrink-0 text-ink-soft/40 transition-transform group-hover:translate-x-0.5"
                        />
                    </a>

                    <div className="flex flex-col justify-center gap-1.5 rounded-2xl border border-ink/5 bg-white p-4 text-xs text-ink-soft">
                        <span className="inline-flex items-center gap-2">
                            <Clock size={13} className="shrink-0 text-harvest" />
                            {KONTAK.jam}
                        </span>
                        <span className="inline-flex items-start gap-2">
                            <MapPin size={13} className="mt-0.5 shrink-0 text-harvest" />
                            {KONTAK.alamat}
                        </span>
                    </div>
                </div>

                {/* Pertanyaan umum */}
                <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
                    <h2 className="flex items-center gap-2 font-display text-xl font-bold text-soil">
                        <HelpCircle size={19} className="text-leaf-dark" />
                        {kunci ? `Hasil pencarian "${cari}"` : "Pertanyaan yang Sering Ditanyakan"}
                    </h2>

                    {!kunci && (
                        <div className="inline-flex rounded-full bg-white p-1 shadow-sm">
                            {(
                                [
                                    ["umum", "Umum", HelpCircle],
                                    ["umkm", "UMKM", Store],
                                    ["pemasok", "Pemasok", Sprout],
                                ] as const
                            ).map(([nilai, label, Ikon]) => {
                                const ini = tab === nilai;

                                return (
                                    <button
                                        key={nilai}
                                        onClick={() => setTab(nilai)}
                                        className="relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                                        style={{ color: ini ? "#FFFFFF" : "#64748B" }}
                                    >
                                        {ini && (
                                            <motion.span
                                                layoutId="tab-bantuan"
                                                className="absolute inset-0 rounded-full bg-leaf-dark"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 380,
                                                    damping: 30,
                                                }}
                                            />
                                        )}

                                        <span className="relative z-10 flex items-center gap-1.5">
                                            <Ikon size={13} />
                                            {label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="mt-5">
                    {daftar.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center">
                            <Search size={24} className="mx-auto text-ink-soft" />
                            <h3 className="mt-3 font-display text-base font-bold text-soil">
                                Tidak ada yang cocok
                            </h3>
                            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
                                Coba kata kunci lain, atau tanyakan langsung lewat WhatsApp.
                            </p>
                        </div>
                    ) : (
                        <Akordeon daftar={daftar} />
                    )}
                </div>

                {/* Penutup */}
                <div className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-[#16241B] via-[#1F4D33] to-[#0E7A6B] p-7 text-white sm:p-9">
                    <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                        <div>
                            <h3 className="font-display text-lg font-bold sm:text-xl">
                                Belum ketemu jawabannya?
                            </h3>
                            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-white/80">
                                Tim kami siap membantu, termasuk pendampingan langsung untuk
                                UMKM dan kelompok tani mitra di wilayah Aceh.
                            </p>
                        </div>

                        <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-soil transition hover:opacity-90"
                        >
                            <MessageCircle size={16} />
                            Hubungi WhatsApp
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}