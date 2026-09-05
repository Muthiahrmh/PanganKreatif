"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Scale,
  Users,
  LineChart,
  ShieldCheck,
  Headset,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const utama = {
  icon: BrainCircuit,
  title: "AI Demand Forecasting",
  desc: "Riwayat penjualanmu diolah jadi perkiraan kebutuhan bahan baku bulan depan — memperhitungkan tren, pola musiman, sampai lonjakan menjelang hari raya.",
  poin: ["Rata-rata bergerak", "Tren linear", "Pola musiman", "Hari libur nasional"],
};

const fitur = [
  {
    icon: Users,
    title: "Belanja Kolektif",
    desc: "Beli bersama UMKM lain supaya kuota grosir tercapai dan harga per satuan turun.",
    warna: "#2563EB",
    preview: "kolektif" as const,
  },
  {
    icon: Scale,
    title: "Perbandingan Pemasok",
    desc: "Harga, stok, jarak, dan estimasi pengiriman dari beberapa pemasok, berdampingan.",
    warna: "#0E7FA6",
    preview: "pemasok" as const,
  },
  {
    icon: LineChart,
    title: "Analitik & Insight",
    desc: "Pantau penghematan, tren permintaan, dan performa bisnis dari satu dashboard.",
    warna: "#0EA5E9",
    preview: "analitik" as const,
  },
  {
    icon: ShieldCheck,
    title: "Aman & Transparan",
    desc: "Potongan komisi ditampilkan terbuka, penerusan dana disertai bukti transfer.",
    warna: "#0B5F7D",
    preview: "aman" as const,
  },
  {
    icon: Headset,
    title: "Dukungan Profesional",
    desc: "Tim kami siap membantu lewat WhatsApp, termasuk pendampingan langsung untuk mitra.",
    warna: "#3E7D22",
    tautan: "/bantuan",
    preview: "dukungan" as const,
  },
];

type JenisPreview = (typeof fitur)[number]["preview"];

/** Mini preview UI sungguhan di tiap kartu fitur — bukan cuma ikon+teks,
 *  terinspirasi cara Outseta menempelkan cuplikan produk asli di tiap
 *  kartu fiturnya. Dibikin dari div/SVG polos, bukan aset gambar. */
function MiniPreviewFitur({ jenis, warna }: { jenis: JenisPreview; warna: string }) {
  if (jenis === "kolektif") {
    return (
      <div className="mt-4 rounded-xl border border-ink/5 bg-white p-3">
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
          <span>Kuota grosir</span>
          <span>8/10 UMKM</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-4/5 rounded-full" style={{ backgroundColor: warna }} />
        </div>
        <div className="mt-2.5 flex -space-x-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="h-5 w-5 rounded-full border-2 border-white"
              style={{ backgroundColor: warna, opacity: 0.45 + i * 0.13 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (jenis === "pemasok") {
    const baris = [
      { nama: "Tani Makmur", nilai: 72 },
      { nama: "Koperasi Gayo", nilai: 55 },
      { nama: "Kelompok Segar", nilai: 40 },
    ];
    return (
      <div className="mt-4 space-y-1.5 rounded-xl border border-ink/5 bg-white p-3">
        {baris.map((b) => (
          <div key={b.nama} className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="w-[4.5rem] shrink-0 truncate">{b.nama}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${b.nilai}%`, backgroundColor: warna }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (jenis === "analitik") {
    const batang = [42, 65, 50, 82, 60, 74];
    return (
      <div className="mt-4 flex h-14 items-end gap-1.5 rounded-xl border border-ink/5 bg-white p-3">
        {batang.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ height: `${h}%`, backgroundColor: warna, opacity: 0.45 + i * 0.09 }}
          />
        ))}
      </div>
    );
  }

  if (jenis === "aman") {
    return (
      <div className="mt-4 space-y-1.5 rounded-xl border border-ink/5 bg-white p-3 text-[10px]">
        <div className="flex items-center justify-between text-slate-500">
          <span>Nilai transaksi</span>
          <span className="font-semibold text-slate-700">Rp2.450.000</span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Komisi platform (2%)</span>
          <span className="font-semibold" style={{ color: warna }}>
            Rp49.000
          </span>
        </div>
        <div className="flex items-center gap-1 pt-0.5 font-semibold" style={{ color: warna }}>
          <CheckCircle2 size={11} />
          Bukti transfer terlampir
        </div>
      </div>
    );
  }

  // dukungan
  return (
    <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-ink/5 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500 sm:mt-0 sm:ml-auto">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      Tim siap membantu
    </span>
  );
}

export function FeaturesSection() {
  return (
    <section id="fitur" className="relative isolate overflow-hidden bg-white">
      {/* Cahaya ambient — supaya latar putih di sekitar kartu fitur tidak
          terasa kosong, senada dengan section lain yang sudah bergradasi */}
      <div className="pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full bg-leaf-soft/60 blur-3xl" />

      {/* PERBAIKAN: pt-20 untuk HP biar nggak terlalu jauh ke bawah, pt-40 untuk desktop */}
      <div className="relative mx-auto w-full max-w-[1700px] px-6 pb-16 pt-24 sm:px-8 lg:px-16 lg:pb-20 lg:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <span className="inline-flex rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-teal-dark">
            Fitur Unggulan
          </span>

          <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-soil md:text-4xl">
            Semua yang dibutuhkan untuk
            <br className="hidden sm:block" />{" "}
            <span className="text-teal-dark">mengatur bahan baku</span>
          </h2>

          <p className="mt-4 text-[15px] leading-relaxed text-ink-soft sm:text-base">
            Dari memperkirakan kebutuhan sampai barang sampai di dapur — dalam satu
            platform, tanpa berpindah aplikasi.
          </p>
        </motion.div>

        {/* PERBAIKAN: gap-4 untuk desktop, tapi gap-5 untuk HP biar lebih lega */}
        <div className="mt-10 grid gap-5 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16241B] via-[#1F4D33] to-[#0B5F7D] p-6 text-white md:col-span-2 lg:col-span-1 lg:row-span-2 sm:p-8"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-leaf/10" />

            <div className="relative h-full flex flex-col">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <utama.icon size={26} strokeWidth={1.6} />
              </span>

              <h3 className="mt-6 font-display text-xl font-bold lg:text-2xl">
                {utama.title}
              </h3>

              <p className="mt-3 text-[14px] leading-relaxed text-white/80">{utama.desc}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {utama.poin.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/85"
                  >
                    {p}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-7">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <div className="text-[11px] text-white/60">Contoh hasil prediksi</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-2xl font-bold">66 kg</span>
                    <span className="text-xs text-teal-300">naik 8%</span>
                  </div>
                  <div className="mt-1 text-[11px] leading-relaxed text-white/70">
                    Cabai Merah, September. Dihitung dari 24 bulan riwayat.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {fitur.map((f, i) => {
            const Icon = f.icon;
            const isLast = i === 4;

            // PERBAIKAN: Di HP, kartu terakhir tetap nyusun ke bawah (flex-col), baru pas di Tablet/Desktop dia nyamping (sm:flex-row)
            const kelasInner = `group flex h-full rounded-3xl border border-ink/5 bg-cream p-5 sm:p-6 transition-all hover:-translate-y-1 hover:border-transparent hover:bg-white hover:shadow-lg hover:shadow-soil/5 ${isLast ? 'flex-col sm:flex-row sm:items-center gap-4 sm:gap-6' : 'flex-col gap-4'
              }`;

            const isi = (
              <>
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                  style={{ backgroundColor: `${f.warna}14`, color: f.warna }}
                >
                  <Icon size={22} strokeWidth={1.75} />
                </span>

                <div className="flex flex-1 flex-col">
                  <h3 className="font-display text-[15px] sm:text-base font-bold text-soil">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] sm:text-sm leading-relaxed text-ink-soft">{f.desc}</p>

                  {f.preview !== "dukungan" && (
                    <MiniPreviewFitur jenis={f.preview} warna={f.warna} />
                  )}

                  {f.tautan && (
                    <span className="mt-auto pt-3 inline-flex items-center gap-1 text-xs font-semibold text-leaf-dark">
                      Buka pusat bantuan
                      <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </div>

                {f.preview === "dukungan" && (
                  <MiniPreviewFitur jenis={f.preview} warna={f.warna} />
                )}
              </>
            );

            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: 0.1 + i * 0.07 }}
                className={isLast ? "md:col-span-2 lg:col-span-3" : ""}
              >
                {f.tautan ? (
                  <Link href={f.tautan} className={kelasInner}>
                    {isi}
                  </Link>
                ) : (
                  <div className={kelasInner}>{isi}</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}