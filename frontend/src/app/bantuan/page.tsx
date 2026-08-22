"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import {
    ArrowLeft,
    MessageCircle,
    Mail,
    MapPin,
    Clock,
    ChevronDown,
    Store,
    Sprout,
} from "lucide-react";

const KONTAK = {
    whatsapp: "6282165383828",
    whatsappTampil: "0821-6538-3828",
    email: "pangankreatif08@gmail.com",
    alamat: "Buketrata, Kecamatan Blang Mangat, Kota Lhokseumawe, Provinsi Aceh",
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
];

const UMKM: Tanya[] = [
    {
        tanya: "Kenapa prediksi saya belum muncul?",
        jawab: "Prediksi dihitung dari riwayat penjualan. Catat dulu penjualan harian di menu Riwayat Penjualan, minimal beberapa bulan supaya polanya terbaca. Semakin panjang riwayatnya, semakin akurat hasilnya.",
    },
    {
        tanya: "Bagaimana harga grosir bisa aktif?",
        jawab: "Pemasok menetapkan jumlah minimal untuk harga grosir. Ketika total pesanan dari seluruh UMKM yang bergabung mencapai jumlah itu, harga otomatis turun untuk semua peserta, termasuk yang bergabung lebih dulu.",
    },
    {
        tanya: "Kenapa prediksi saya menyarankan mengurangi pembelian?",
        jawab: "Sistem membandingkan perkiraan kebutuhan bulan depan dengan rata-rata tiga bulan terakhir. Kalau lebih rendah, kamu disarankan menahan pembelian supaya tidak ada bahan yang terbuang.",
    },
    {
        tanya: "Setelah bayar, kapan pesanan dikirim?",
        jawab: "Pemasok memeriksa pembayaran lebih dulu, lalu menutup pesanan setelah batas waktu bergabung lewat, baru mengirim. Statusnya bisa kamu pantau di menu Transaksi.",
    },
];

const PEMASOK: Tanya[] = [
    {
        tanya: "Kapan dana penjualan saya diteruskan?",
        jawab: "Pembayaran UMKM masuk lebih dulu ke rekening platform. Setelah dipotong komisi, sisanya diteruskan ke rekeningmu. Statusnya bisa dilihat di menu Pembayaran, lengkap dengan bukti transfernya.",
    },
    {
        tanya: "Kenapa dana yang saya terima lebih kecil dari nilai transaksi?",
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
];

function Akordeon({ daftar }: { daftar: Tanya[] }) {
    const [terbuka, setTerbuka] = useState<number | null>(null);

    return (
        <div className="divide-y divide-ink/5 rounded-2xl border border-ink/5 bg-white">
            {daftar.map((t, i) => (
                <div key={t.tanya}>
                    <button
                        onClick={() => setTerbuka(terbuka === i ? null : i)}
                        aria-expanded={terbuka === i}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-paper-soft"
                    >
                        <span className="text-sm font-medium text-ink">{t.tanya}</span>
                        <ChevronDown
                            size={16}
                            className={`shrink-0 text-ink-soft transition-transform ${terbuka === i ? "rotate-180" : ""
                                }`}
                        />
                    </button>

                    {terbuka === i && (
                        <p className="px-5 pb-4 text-sm leading-relaxed text-ink-soft">
                            {t.jawab}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function BantuanPage() {
    const [tab, setTab] = useState<"umum" | "umkm" | "pemasok">("umum");

    const user = useAuthStore((s) => s.user);
    const hydrated = useAuthStore((s) => s.hydrated);

    const sudahMasuk = hydrated && Boolean(user);
    const tujuanKembali = sudahMasuk ? "/dashboard" : "/";
    const labelKembali = sudahMasuk ? "Kembali ke dashboard" : "Kembali ke beranda";

    const daftar = tab === "umkm" ? UMKM : tab === "pemasok" ? PEMASOK : UMUM;

    const pesanWa = encodeURIComponent(
        "Halo PanganKreatif, saya butuh bantuan terkait "
    );

    return (
        <div className="min-h-screen bg-paper-soft/40">
            <header className="border-b border-ink/5 bg-white">
                <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
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
                        className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
                    >
                        <ArrowLeft size={15} />
                        {labelKembali}
                    </Link>
                </div>
            </header>

            <main className="mx-auto w-full max-w-5xl px-6 py-12">
                <h1 className="font-display text-3xl font-bold text-ink">Pusat Bantuan</h1>
                <p className="mt-2 max-w-2xl text-ink-soft">
                    Ada yang membingungkan? Hubungi kami langsung, atau cari jawabannya di
                    pertanyaan yang sering ditanyakan di bawah.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <a
                        href={`https://wa.me/${KONTAK.whatsapp}?text=${pesanWa}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-4 rounded-2xl border border-ink/5 bg-white p-5 transition hover:border-brand-green"
                    >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-brand-green">
                            <MessageCircle size={20} />
                        </span>

                        <div>
                            <div className="font-display text-base font-bold text-ink">
                                WhatsApp
                            </div>
                            <div className="mt-0.5 text-sm text-ink-soft">
                                {KONTAK.whatsappTampil}
                            </div>
                            <div className="mt-1 text-xs text-brand-green">
                                Paling cepat dibalas
                            </div>
                        </div>
                    </a>

                    <a
                        href={`mailto:${KONTAK.email}`}
                        className="flex items-start gap-4 rounded-2xl border border-ink/5 bg-white p-5 transition hover:border-brand-blue"
                    >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-blue">
                            <Mail size={20} />
                        </span>

                        <div>
                            <div className="font-display text-base font-bold text-ink">Email</div>
                            <div className="mt-0.5 break-all text-sm text-ink-soft">
                                {KONTAK.email}
                            </div>
                            <div className="mt-1 text-xs text-ink-soft">
                                Untuk pertanyaan yang lebih rinci
                            </div>
                        </div>
                    </a>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 rounded-2xl border border-ink/5 bg-white px-5 py-4 text-sm text-ink-soft">
                    <span className="inline-flex items-center gap-2">
                        <Clock size={15} /> {KONTAK.jam}
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <MapPin size={15} /> {KONTAK.alamat}
                    </span>
                </div>

                {/* Pertanyaan umum */}
                <h2 className="mt-12 font-display text-xl font-bold text-ink">
                    Pertanyaan yang Sering Ditanyakan
                </h2>

                <div className="mt-4 flex flex-wrap gap-2">
                    {(
                        [
                            ["umum", "Umum", null],
                            ["umkm", "UMKM Kuliner", Store],
                            ["pemasok", "Pemasok", Sprout],
                        ] as const
                    ).map(([nilai, label, Ikon]) => (
                        <button
                            key={nilai}
                            onClick={() => setTab(nilai)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${tab === nilai
                                    ? "bg-brand-blue text-white"
                                    : "bg-white text-ink-soft hover:text-ink"
                                }`}
                        >
                            {Ikon && <Ikon size={14} />}
                            {label}
                        </button>
                    ))}
                </div>

                <div className="mt-4">
                    <Akordeon daftar={daftar} />
                </div>

                <div className="mt-10 rounded-2xl bg-gradient-to-r from-[#0B1220] to-[#2563EB] p-6 text-white">
                    <h3 className="font-display text-lg font-bold">Belum ketemu jawabannya?</h3>
                    <p className="mt-1 text-sm text-white/85">
                        Tim kami siap membantu, termasuk pendampingan langsung untuk UMKM dan
                        kelompok tani mitra di wilayah Aceh.
                    </p>

                    <a
                        href={`https://wa.me/${KONTAK.whatsapp}?text=${pesanWa}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:opacity-90"
                    >
                        <MessageCircle size={15} />
                        Hubungi lewat WhatsApp
                    </a>
                </div>
            </main>
        </div>
    );
}