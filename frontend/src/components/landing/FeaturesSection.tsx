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
    warna: "#2563EB", // Aksen Biru
  },
  {
    icon: Scale,
    title: "Perbandingan Pemasok",
    desc: "Harga, stok, jarak, dan estimasi pengiriman dari beberapa pemasok, berdampingan.",
    warna: "#159B87", // Aksen Teal
  },
  {
    icon: LineChart,
    title: "Analitik & Insight",
    desc: "Pantau penghematan, tren permintaan, dan performa bisnis dari satu dashboard.",
    warna: "#D98324", // Aksen Oranye
  },
  {
    icon: ShieldCheck,
    title: "Aman & Transparan",
    desc: "Potongan komisi ditampilkan terbuka, penerusan dana disertai bukti transfer.",
    warna: "#0E7A6B", // Aksen Teal Gelap
  },
  {
    icon: Headset,
    title: "Dukungan Profesional",
    desc: "Tim kami siap membantu lewat WhatsApp, termasuk pendampingan langsung untuk mitra.",
    warna: "#3E7D22", // Aksen Hijau
    tautan: "/bantuan",
  },
];

export function FeaturesSection() {
  return (
    <section id="fitur" className="bg-white">
      <div className="mx-auto w-full max-w-[1700px] px-6 py-20 sm:px-8 lg:px-16">
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

          <h2 className="mt-4 font-display text-2xl font-bold leading-tight text-soil md:text-4xl">
            Semua yang dibutuhkan untuk
            <br className="hidden sm:block" />{" "}
            <span className="text-teal-dark">mengatur bahan baku</span>
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
            Dari memperkirakan kebutuhan sampai barang sampai di dapur — dalam satu
            platform, tanpa berpindah aplikasi.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16241B] via-[#1F4D33] to-[#0E7A6B] p-7 text-white lg:row-span-2 lg:p-8"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-leaf/10" />

            <div className="relative">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <utama.icon size={26} strokeWidth={1.6} />
              </span>

              <h3 className="mt-6 font-display text-xl font-bold lg:text-2xl">
                {utama.title}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-white/80">{utama.desc}</p>

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

              <div className="mt-7 rounded-2xl bg-white/10 p-4 backdrop-blur">
                <div className="text-[11px] text-white/60">Contoh hasil prediksi</div>

                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold">66 kg</span>
                  <span className="text-xs text-teal-300">naik 8%</span>
                </div>

                <div className="mt-1 text-[11px] leading-relaxed text-white/70">
                  Cabai Merah, September. Dihitung dari 24 bulan riwayat penjualan.
                </div>
              </div>
            </div>
          </motion.div>

          {fitur.map((f, i) => {
            const Icon = f.icon;

            const isi = (
              <>
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                  style={{ backgroundColor: `${f.warna}14`, color: f.warna }}
                >
                  <Icon size={20} strokeWidth={1.75} />
                </span>

                <h3 className="mt-4 font-display text-base font-bold text-soil">
                  {f.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.desc}</p>

                {f.tautan && (
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-leaf-dark">
                    Buka pusat bantuan
                    <ArrowRight
                      size={12}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                )}
              </>
            );

            const kelas =
              "group flex h-full flex-col rounded-3xl border border-ink/5 bg-cream p-6 transition-all hover:-translate-y-1 hover:border-transparent hover:bg-white hover:shadow-lg hover:shadow-soil/5";

            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: 0.1 + i * 0.07 }}
              >
                {f.tautan ? (
                  <Link href={f.tautan} className={kelas}>
                    {isi}
                  </Link>
                ) : (
                  <div className={kelas}>{isi}</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}