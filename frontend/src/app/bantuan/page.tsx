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

const KONTAK = {
    whatsapp: "6282165383828",
    whatsappTampil: "0821-6538-3828",
    email: "pangankreatif08@gmail.com",
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
        tanya: "Apakah platform ini gratis?",
        jawab: "Mendaftar dan memakai fitur pencatatan, prediksi, serta perbandingan pemasok tidak dipungut biaya. Platform mengambil komisi dari setiap transaksi yang berhasil, dan besarnya sudah termasuk dalam harga akhir yang tertera.",
    },
    {
        tanya: "Bagaimana keamanan data penjualan saya?",
        jawab: "Kami menggunakan enkripsi standar industri. Data penjualan harianmu hanya digunakan oleh sistem AI untuk menghasilkan prediksi kebutuhanmu sendiri, dan tidak akan pernah dibagikan kepada UMKM pesaing atau pihak ketiga lainnya.",
    },
    {
        tanya: "Kenapa harus verifikasi email?",
        jawab: "Supaya kami bisa memastikan akun benar-benar milikmu dan mengirimkan pemberitahuan penting soal pesanan. Tautan verifikasi berlaku 5 menit; kalau lewat, minta kirim ulang dari halaman verifikasi.",
    },
    {
        tanya: "Bisakah saya mendaftar sebagai UMKM dan Pemasok sekaligus?",
        jawab: "Saat ini, satu akun (satu alamat email) hanya bisa digunakan untuk satu peran. Jika kamu memiliki usaha kuliner sekaligus menjadi distributor, silakan mendaftar menggunakan dua email yang berbeda.",
    },
    {
        tanya: "Saya lupa password, bagaimana memulihkannya?",
        jawab: "Untuk sekarang hubungi kami lewat WhatsApp dengan menyebutkan email yang terdaftar. Pemulihan password mandiri melalui email sedang dalam tahap pengembangan.",
    },
    {
        tanya: "Bisa dibuka dari HP?",
        jawab: "Bisa. Buka alamatnya di browser HP, lalu pasang ke layar utama — di Android akan muncul tawaran otomatis, di iPhone lewat tombol Share pilih Add to Home Screen. Tampilannya akan menyesuaikan secara responsif.",
    },
    {
        tanya: "Apakah PanganKreatif melayani seluruh Indonesia?",
        jawab: "Fokus operasional awal kami adalah wilayah Lhokseumawe, Aceh Utara, Bireuen, Pidie, dan Bener Meriah. Kami akan terus berekspansi ke kota-kota lain secara bertahap.",
    },
];

const UMKM: Tanya[] = [
    {
        tanya: "Kenapa prediksi kebutuhan saya belum muncul?",
        jawab: "Prediksi dihitung dari riwayat penjualan. Catat dulu penjualan harian di menu Riwayat Penjualan. Diperlukan data minimal 30 hari agar pola dasar mulai terbaca. Semakin panjang riwayatnya, semakin akurat hasilnya.",
    },
    {
        tanya: "Bagaimana harga grosir (Belanja Kolektif) bisa aktif?",
        jawab: "Pemasok menetapkan batas kuota minimal untuk harga grosir. Ketika total pesanan dari seluruh UMKM yang bergabung mencapai kuota tersebut, harga otomatis turun untuk semua peserta — termasuk kamu yang bergabung lebih dulu.",
    },
    {
        tanya: "Kenapa prediksi AI menyarankan saya mengurangi pembelian?",
        jawab: "Sistem AI membandingkan tren perkiraan bulan depan dengan rata-rata tiga bulan terakhir. Kalau diproyeksikan sepi (misalnya bukan musim liburan), kamu disarankan menahan pembelian supaya bahan baku tidak menumpuk dan basi.",
    },
    {
        tanya: "Setelah bayar, kapan pesanan dikirim?",
        jawab: "Pemasok memeriksa pembayaran lebih dulu, lalu menunggu batas waktu 'Belanja Kolektif' ditutup, baru pesanan dikirim serentak. Estimasi tanggal pengiriman selalu tertera di rincian pesananmu.",
    },
    {
        tanya: "Bagaimana jika bahan baku yang datang rusak atau tidak segar?",
        jawab: "Pemasok mitra kami terikat dengan kebijakan garansi retur 1x24 jam. Jika barang tidak sesuai, foto barang tersebut dan ajukan komplain melalui menu 'Pesanan Saya'.",
    },
    {
        tanya: "Apakah ada batas minimal nominal pemesanan?",
        jawab: "Tidak ada batas minimal pemesanan untuk UMKM individu. Namun, pesananmu yang kecil akan digabungkan dengan UMKM lain oleh sistem agar memenuhi kuota pengiriman pemasok.",
    },
    {
        tanya: "Bisakah pesanan dibatalkan jika sudah dibayar?",
        jawab: "Pesanan hanya bisa dibatalkan jika statusnya masih 'Menunggu Kuota'. Jika status sudah berubah menjadi 'Diproses Pemasok' atau 'Dikirim', pesanan tidak dapat dibatalkan.",
    },
    {
        tanya: "Apa maksud faktor musiman dan hari libur pada analitik?",
        jawab: "Selain tren, sistem melihat apakah bulan tertentu (seperti Ramadhan atau Idul Adha) lebih ramai bagi usahamu. Faktor ini dipelajari dari riwayatmu sendiri, sehingga saran pembelian akan otomatis dinaikkan mendekati hari besar tersebut.",
    },
];

const PEMASOK: Tanya[] = [
    {
        tanya: "Kapan dana hasil penjualan diteruskan ke rekening saya?",
        jawab: "Pembayaran UMKM ditampung lebih dulu dengan aman oleh platform. Setelah barang dikonfirmasi diterima, dana (dikurangi komisi) akan otomatis diteruskan ke rekeningmu dalam waktu 1x24 jam kerja.",
    },
    {
        tanya: "Kenapa dana yang saya terima lebih kecil dari harga jual?",
        jawab: "Terdapat potongan biaya operasional platform (komisi) yang presentasenya sudah disepakati di awal. Detail potongan ditransparansikan secara rinci pada setiap resi transaksi di menu Pembayaran.",
    },
    {
        tanya: "Apakah saya yang harus mengantar barang ke UMKM?",
        jawab: "Ya, saat ini pemasok bertanggung jawab atas logistik pengiriman ke lokasi UMKM. Namun, berkat sistem Belanja Kolektif, kamu bisa mengirim pesanan besar ke rute yang searah dalam sekali jalan.",
    },
    {
        tanya: "Bagaimana cara menambah komoditas baru ke katalog?",
        jawab: "Masuk ke menu 'Katalog Produk', klik 'Tambah Baru', lalu masukkan detail nama, satuan (kg/liter), batas minimum kuota grosir, dan tingkatan harganya.",
    },
    {
        tanya: "Kenapa saya harus mengisi rekening bank?",
        jawab: "Tanpa data rekening bank yang valid, sistem kami tidak bisa mencairkan dana hasil penjualanmu. Pastikan nama di rekening sesuai dengan identitas KTP yang didaftarkan.",
    },
    {
        tanya: "Apa gunanya fitur batas minimal harga grosir?",
        jawab: "Harga grosir memancing UMKM untuk mengajak rekanannya membeli dari tokomu. Bagimu, margin per barang mungkin lebih tipis, tapi volume barang yang terjual jauh lebih besar dan ongkos logistik lebih hemat.",
    },
    {
        tanya: "Bagaimana cara tahu komoditas apa yang sedang banyak dicari?",
        jawab: "Di dashboard Pemasok, terdapat panel 'Permintaan Pasar' yang menampilkan komoditas paling dicari oleh UMKM di wilayahmu bulan ini, sehingga kamu bisa menyetok barang yang tepat.",
    },
    {
        tanya: "Bisakah saya menolak pesanan yang masuk?",
        jawab: "Bisa, jika stok sedang kosong atau ada kendala operasional. Namun, persentase penolakan pesanan yang tinggi akan menurunkan *rating* tokomu di mata algoritma PanganKreatif.",
    },
];

// KONFIGURASI TEMA DINAMIS (Harmoni Biru & Hijau)
const TEMA = {
    umum: {
        bg: "bg-teal-600",
        soft: "bg-teal-50",
        text: "text-teal-700",
        border: "border-teal-400/40",
        shadow: "shadow-teal-500/10",
        icon: "text-teal-600",
    },
    umkm: {
        bg: "bg-blue-600", // Aksen Biru untuk UMKM
        soft: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-400/40",
        shadow: "shadow-blue-500/10",
        icon: "text-blue-600",
    },
    pemasok: {
        bg: "bg-leaf-dark", // Aksen Hijau untuk Pemasok
        soft: "bg-leaf-soft",
        text: "text-leaf-dark",
        border: "border-leaf/40",
        shadow: "shadow-leaf/10",
        icon: "text-leaf-dark",
    },
};

function Akordeon({ daftar, temaAktif }: { daftar: Tanya[]; temaAktif: typeof TEMA.umum }) {
    const [terbuka, setTerbuka] = useState<number | null>(0);

    return (
        <div className="flex flex-col gap-3">
            {daftar.map((t, i) => {
                const ini = terbuka === i;

                return (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={t.tanya}
                        className={`overflow-hidden rounded-2xl border transition-all duration-300 ${ini ? `${temaAktif.border} bg-white shadow-md ${temaAktif.shadow}` : "border-ink/10 bg-white/60 hover:bg-white hover:border-ink/20"
                            }`}
                    >
                        <button
                            onClick={() => setTerbuka(ini ? null : i)}
                            aria-expanded={ini}
                            className="flex w-full items-center justify-between gap-4 px-5 py-4 lg:px-6 lg:py-5 text-left outline-none"
                        >
                            <span className="flex items-center gap-4">
                                <span
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors duration-300 ${ini
                                            ? `${temaAktif.bg} text-white shadow-sm`
                                            : `${temaAktif.soft} ${temaAktif.text}`
                                        }`}
                                >
                                    {i + 1}
                                </span>

                                <span className={`text-[15px] font-semibold transition-colors duration-300 ${ini ? "text-soil" : "text-ink"}`}>
                                    {t.tanya}
                                </span>
                            </span>

                            <ChevronDown
                                size={18}
                                className={`shrink-0 transition-transform duration-300 ${ini ? `rotate-180 ${temaAktif.icon}` : "text-ink-soft"
                                    }`}
                            />
                        </button>

                        <AnimatePresence initial={false}>
                            {ini && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                >
                                    <p className="px-5 pb-5 pl-[4.25rem] lg:px-6 lg:pb-6 lg:pl-[4.75rem] text-[14px] leading-relaxed text-ink-soft">
                                        {t.jawab}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
}

export default function BantuanPage() {
    const [tab, setTab] = useState<"umum" | "umkm" | "pemasok">("umum");
    const [cari, setCari] = useState("");

    const user = useAuthStore((s) => s.user);
    const hydrated = useAuthStore((s) => s.hydrated);

    const sudahMasuk = hydrated && Boolean(user);
    const tujuanKembali = sudahMasuk ? "/dashboard" : "/";
    const labelKembali = sudahMasuk ? "Kembali ke dashboard" : "Kembali ke beranda";

    const pesanWa = encodeURIComponent("Halo PanganKreatif, saya butuh bantuan terkait ");
    const waUrl = `https://wa.me/${KONTAK.whatsapp}?text=${pesanWa}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${KONTAK.email}`;

    const semua = { umum: UMUM, umkm: UMKM, pemasok: PEMASOK };

    const kunci = cari.trim().toLowerCase();
    const daftar = kunci
        ? [...UMUM, ...UMKM, ...PEMASOK].filter(
            (t) =>
                t.tanya.toLowerCase().includes(kunci) ||
                t.jawab.toLowerCase().includes(kunci)
        )
        : semua[tab];

    const kataKunciEasterEgg = ["capek", "lelah", "pusing", "nyerah", "susah"];
    const isEasterEgg = kunci && daftar.length === 0 && kataKunciEasterEgg.some((kata) => kunci.includes(kata));

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
                        className="group inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white py-2 pl-3 pr-4 text-sm font-medium text-ink-soft shadow-sm transition-all hover:border-ink/20 hover:text-blue-600 hover:shadow"
                    >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cream transition-transform group-hover:-translate-x-0.5">
                            <ArrowLeft size={13} />
                        </span>
                        <span className="hidden sm:inline">{labelKembali}</span>
                        <span className="sm:hidden">Kembali</span>
                    </Link>
                </div>
            </header>

            {/* Kepala Halaman: Gradasi Harmoni Biru ke Hijau Teal */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#0E7A6B] to-[#1F4D33] text-white">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

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

                    <div className="relative mt-7 max-w-xl shadow-lg rounded-full">
                        <Search
                            size={18}
                            className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-ink-soft"
                        />
                        <input
                            value={cari}
                            onChange={(e) => setCari(e.target.value)}
                            placeholder="Cari pertanyaan, misalnya harga grosir..."
                            className="w-full rounded-full border-0 bg-white py-4 pl-12 pr-4 text-[15px] text-ink outline-none ring-4 ring-white/10 transition placeholder:text-ink-soft/60 focus:ring-blue-500/40"
                        />
                    </div>
                </div>
            </div>

            <main className="mx-auto w-full max-w-5xl px-6 py-12">
                {/* Kontak Kotak Atas: WhatsApp (Hijau), Email (Biru) */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-4 rounded-3xl border border-ink/5 bg-white p-5 transition-all hover:-translate-y-1 hover:border-green-400/40 hover:shadow-xl hover:shadow-green-500/5"
                    >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                            <MessageCircle size={22} />
                        </span>

                        <div className="min-w-0">
                            <div className="font-display text-[15px] font-bold text-soil">
                                WhatsApp
                            </div>
                            <div className="font-data text-xs text-ink-soft mt-0.5">
                                {KONTAK.whatsappTampil}
                            </div>
                        </div>
                    </a>

                    <a
                        href={gmailUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-4 rounded-3xl border border-ink/5 bg-white p-5 transition-all hover:-translate-y-1 hover:border-blue-400/40 hover:shadow-xl hover:shadow-blue-500/5"
                    >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <Mail size={22} />
                        </span>

                        <div className="min-w-0">
                            <div className="font-display text-[15px] font-bold text-soil">
                                Email
                            </div>
                            <div className="truncate text-xs text-ink-soft mt-0.5">
                                {KONTAK.email}
                            </div>
                        </div>
                    </a>

                    <div className="flex flex-col justify-center gap-2 rounded-3xl border border-ink/5 bg-white p-5 text-xs text-ink-soft">
                        <span className="inline-flex items-center gap-2.5">
                            <Clock size={14} className="shrink-0 text-blue-600" />
                            {KONTAK.jam}
                        </span>
                        <span className="inline-flex items-start gap-2.5">
                            <MapPin size={14} className="mt-0.5 shrink-0 text-teal-600" />
                            {KONTAK.alamat}
                        </span>
                    </div>
                </div>

                {/* Bagian Accordion FAQ */}
                <div className="mt-16 flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h2 className="flex items-center gap-2.5 font-display text-2xl font-bold text-soil">
                        <HelpCircle size={24} className="text-blue-600" />
                        {kunci ? `Hasil pencarian "${cari}"` : "Pertanyaan yang Sering Ditanyakan"}
                    </h2>

                    {!kunci && (
                        <div className="inline-flex rounded-full bg-white p-1.5 shadow-sm border border-ink/5">
                            {(
                                [
                                    ["umum", "Umum", HelpCircle],
                                    ["umkm", "UMKM", Store],
                                    ["pemasok", "Pemasok", Sprout],
                                ] as const
                            ).map(([nilai, label, Ikon]) => {
                                const ini = tab === nilai;
                                const warnaBg = TEMA[nilai].bg; // Ambil warna latar dinamis sesuai tema

                                return (
                                    <button
                                        key={nilai}
                                        onClick={() => setTab(nilai)}
                                        className="relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-colors"
                                        style={{ color: ini ? "#FFFFFF" : "#64748B" }}
                                    >
                                        {ini && (
                                            <motion.span
                                                layoutId="tab-bantuan"
                                                className={`absolute inset-0 rounded-full ${warnaBg} shadow-md`}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 400,
                                                    damping: 30,
                                                }}
                                            />
                                        )}

                                        <span className="relative z-10 flex items-center gap-2">
                                            <Ikon size={16} />
                                            {label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="mt-2">
                    {/* Logika Tampilan Berdasarkan Pencarian */}
                    {isEasterEgg ? (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="rounded-3xl border border-blue-200 bg-blue-50/50 p-12 text-center shadow-inner"
                        >
                            <span className="inline-block text-5xl mb-2 animate-bounce">💆‍♂️☕</span>
                            <h3 className="mt-4 font-display text-xl font-bold text-blue-800">
                                Waduh, kamu pasti capek banget ya?
                            </h3>
                            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-blue-900/80">
                                Mengelola bisnis kuliner dan berhadapan dengan *error* kodingan memang bikin pusing kepala. Tinggalkan layarmu sebentar, minum teh hangat, dan tarik napas panjang. PanganKreatif akan setia menunggu sampai energimu penuh lagi! Semangat! 🔥
                            </p>
                        </motion.div>
                    ) : daftar.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-ink/15 bg-white p-12 text-center">
                            <Search size={32} className="mx-auto text-ink-soft/50 mb-4" />
                            <h3 className="font-display text-lg font-bold text-soil">
                                Tidak ada jawaban yang cocok
                            </h3>
                            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft leading-relaxed">
                                Kami tidak dapat menemukan jawaban untuk "{cari}". Coba gunakan kata kunci lain, atau tanyakan langsung kepada tim kami lewat WhatsApp atau Email.
                            </p>
                        </div>
                    ) : (
                        <Akordeon daftar={daftar} temaAktif={kunci ? TEMA.umum : TEMA[tab]} />
                    )}
                </div>

                {/* Penutup: Gradasi Harmoni Biru ke Hijau Tua */}
                <div className="mt-16 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E3A8A] via-[#0E7A6B] to-[#1F4D33] p-8 text-white sm:p-10 relative">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-xl" />
                    <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center relative z-10">
                        <div>
                            <h3 className="font-display text-xl font-bold sm:text-2xl">
                                Masih kebingungan?
                            </h3>
                            <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-white/80">
                                Jangan sungkan. Tim ahli kami siap memandu kamu secara langsung lewat pesan WhatsApp, khusus untuk mitra di wilayah Aceh.
                            </p>
                        </div>

                        <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex shrink-0 items-center gap-2.5 rounded-2xl bg-white px-6 py-3.5 text-[15px] font-bold text-blue-700 transition-all hover:scale-105 hover:shadow-lg hover:shadow-black/10"
                        >
                            <MessageCircle size={18} className="text-blue-600" />
                            Hubungi Kami
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}