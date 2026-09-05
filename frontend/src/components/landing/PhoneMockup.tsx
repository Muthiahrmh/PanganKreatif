"use client";

import { Sparkles, Bell, ShoppingCart, Truck, TrendingUp } from "lucide-react";

/**
 * Cuplikan tampilan di layar ponsel — disesuaikan dengan desain dashboard
 * yang sekarang dipakai (latar krem, kartu hero gradasi gelap-ke-aksen
 * warna peran, bukan lagi tema biru/hijau lama). Bezel dibuat generik
 * (bukan notch ala iPhone) karena aplikasinya cuma tersedia untuk
 * Android — mitra UMKM & Kelompok Tani pakainya di HP Android.
 *
 * Menerima prop `peran` supaya bisa menampilkan dua sisi produk
 * sekaligus: sisi UMKM (pembeli) dan sisi Kelompok Tani (pemasok).
 */
type Peran = "umkm" | "supplier";

const TEMA: Record<Peran, { sidebar: string; aksen: string }> = {
    umkm: { sidebar: "#0B1E3D", aksen: "#2563EB" },
    supplier: { sidebar: "#0B2A1B", aksen: "#16A34A" },
};

const ISI: Record<
    Peran,
    {
        topbar: string;
        insight: { label: string; nilai: string; ket: string };
        statA: { label: string; nilai: string };
        statB: { label: string; nilai: string };
        daftar: { judul: string; baris: { nama: string; nilai: string; ket: string }[]; tombol: string };
        progres: { judul: string; ket: string; persen: number; sisa: string };
    }
> = {
    umkm: {
        topbar: "Beranda",
        insight: { label: "AI Insight", nilai: "66 kg", ket: "Cabai Merah · naik 8% bulan depan" },
        statA: { label: "Pesanan Aktif", nilai: "2" },
        statB: { label: "Hemat", nilai: "Rp297rb" },
        daftar: {
            judul: "Rekomendasi Pembelian",
            baris: [
                { nama: "Cabai Merah", nilai: "66 kg", ket: "hemat Rp297rb" },
                { nama: "Bawang Merah", nilai: "42 kg", ket: "hemat Rp158rb" },
            ],
            tombol: "Gabung Pesanan",
        },
        progres: { judul: "Menuju Harga Grosir", ket: "47/60 kg", persen: 78, sisa: "Kurang 13 kg lagi" },
    },
    supplier: {
        topbar: "Pesanan Masuk",
        insight: { label: "Permintaan Terkumpul", nilai: "180 kg", ket: "Cabai Merah · dari 5 UMKM" },
        statA: { label: "Pesanan Baru", nilai: "3" },
        statB: { label: "Pendapatan", nilai: "Rp2,1jt" },
        daftar: {
            judul: "Kuota Pesanan Kolektif",
            baris: [
                { nama: "Warung Bude", nilai: "35 kg", ket: "menunggu kirim" },
                { nama: "Katering Sari", nilai: "20 kg", ket: "menunggu kirim" },
            ],
            tombol: "Terima & Kirim",
        },
        progres: { judul: "Kuota Pengiriman", ket: "180/200 kg", persen: 90, sisa: "Kurang 20 kg lagi" },
    },
};

export function PhoneMockup({ peran = "umkm" }: { peran?: Peran }) {
    const tema = TEMA[peran];
    const isi = ISI[peran];

    return (
        <div className="w-[9.5rem] origin-center scale-100 overflow-hidden rounded-[1.6rem] border-[5px] border-navy bg-cream shadow-2xl ring-1 ring-black/5 sm:scale-110">
            {/* Topbar krem + garis bawah warna peran — meniru DashboardTopbar asli */}
            <div
                className="flex items-center justify-between bg-cream px-2.5 py-2"
                style={{ borderBottom: `2px solid ${tema.aksen}` }}
            >
                <div className="text-[9px] font-bold text-ink">{isi.topbar}</div>

                <div className="flex items-center gap-1.5">
                    <Bell size={9} className="text-ink-soft" />
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: tema.aksen }} />
                </div>
            </div>

            <div className="space-y-1.5 p-2">
                {/* Kartu hero mini — gradasi gelap ke aksen peran, sama pola
                    dengan hero header di dashboard sungguhan */}
                <div
                    className="rounded-lg p-2 text-white"
                    style={{ background: `linear-gradient(135deg, ${tema.sidebar}, ${tema.aksen})` }}
                >
                    <div className="flex items-center gap-1 text-[8px] font-semibold">
                        <Sparkles size={8} />
                        {isi.insight.label}
                    </div>

                    <div className="mt-1 font-display text-base font-bold leading-none">{isi.insight.nilai}</div>
                    <div className="mt-0.5 text-[7px] text-white/85">{isi.insight.ket}</div>
                </div>

                {/* Dua kartu ringkas */}
                <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-white p-1.5">
                        <div className="text-[7px] text-ink-soft">{isi.statA.label}</div>
                        <div className="text-[11px] font-bold text-ink">{isi.statA.nilai}</div>
                    </div>

                    <div className="rounded-lg bg-white p-1.5">
                        <div className="text-[7px] text-ink-soft">{isi.statB.label}</div>
                        <div className="text-[11px] font-bold" style={{ color: tema.aksen }}>
                            {isi.statB.nilai}
                        </div>
                    </div>
                </div>

                {/* Daftar rekomendasi / kuota kolektif */}
                <div className="rounded-lg bg-white p-2">
                    <div className="mb-1.5 flex items-center gap-1 text-[8px] font-semibold text-ink">
                        <Sparkles size={8} style={{ color: tema.aksen }} />
                        {isi.daftar.judul}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        {isi.daftar.baris.map((b) => (
                            <div key={b.nama} className="flex items-center gap-1.5">
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-[8px] font-medium text-ink">{b.nama}</div>
                                    <div className="text-[7px] text-ink-soft">{b.ket}</div>
                                </div>

                                <span className="shrink-0 text-[8px] font-bold" style={{ color: tema.aksen }}>
                                    {b.nilai}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div
                        className="mt-2 flex items-center justify-center gap-1 rounded-md py-1 text-[8px] font-semibold text-white"
                        style={{ backgroundColor: tema.aksen }}
                    >
                        {peran === "umkm" ? <ShoppingCart size={8} /> : <Truck size={8} />}
                        {isi.daftar.tombol}
                    </div>
                </div>

                {/* Progres kuota */}
                <div className="rounded-lg bg-white p-2">
                    <div className="flex items-center justify-between text-[7px]">
                        <span className="font-medium text-ink">{isi.progres.judul}</span>
                        <span className="text-ink-soft">{isi.progres.ket}</span>
                    </div>

                    <div className="mt-1 h-1 rounded-full bg-slate-100">
                        <div
                            className="h-1 rounded-full"
                            style={{ width: `${isi.progres.persen}%`, backgroundColor: tema.aksen }}
                        />
                    </div>

                    <div className="mt-1 flex items-center gap-0.5 text-[7px] text-ink-soft">
                        <TrendingUp size={7} style={{ color: tema.aksen }} />
                        {isi.progres.sisa}
                    </div>
                </div>
            </div>
        </div>
    );
}
