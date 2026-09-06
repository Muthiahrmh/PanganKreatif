"use client";

import { motion } from "framer-motion";
import { Store, Sprout, Receipt, TrendingDown, MapPin } from "lucide-react";
import { CountUp } from "@/components/ui/CountUp"; // Pastikan path ini benar di proyekmu

const target = [
  {
    icon: Store,
    angka: 300,
    akhiran: "",
    label: "UMKM Kuliner",
    sub: "Warung, kafe, dan katering mitra perdana",
    color: "text-blue-400",
    bg: "bg-blue-400/15"
  },
  {
    icon: Sprout,
    angka: 20,
    akhiran: "",
    label: "Kelompok Tani",
    sub: "Jejaring pemasok dan distributor lokal",
    color: "text-leaf",
    bg: "bg-leaf/15"
  },
  {
    icon: Receipt,
    angka: 2000,
    akhiran: "+",
    label: "Transaksi Kolektif",
    sub: "Proyeksi transaksi di tahun pertama",
    color: "text-teal-400",
    bg: "bg-teal-400/15"
  },
  {
    icon: TrendingDown,
    angka: 25,
    akhiran: "%",
    label: "Efisiensi Biaya",
    sub: "Target penghematan operasional mitra",
    color: "text-leaf",
    bg: "bg-leaf/15"
  },
];

const kuartal = [
  { label: "K1", umkm: 30 },
  { label: "K2", umkm: 80 },
  { label: "K3", umkm: 170 },
  { label: "K4", umkm: 300 },
];

export function StatsBar() {
  const maks = 300;

  return (
    <section id="statistik" className="relative overflow-hidden bg-soil py-10 text-white sm:py-16 lg:py-20">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-leaf/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-teal/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1700px] px-5 sm:px-8 lg:px-16">
        <div className="grid gap-4 sm:gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 uppercase tracking-wider">
              Roadmap & Proyeksi
            </span>

            <h2 className="mt-2.5 font-display text-xl font-bold leading-tight sm:mt-4 sm:text-3xl md:text-4xl">
              Membangun ekosistem,
              <br className="hidden sm:block" />{" "}
              <span className="text-leaf">menciptakan dampak nyata.</span>
            </h2>

            <p className="mt-2.5 max-w-md text-[12.5px] leading-relaxed text-white/70 sm:mt-4 sm:text-sm">
              Target pertumbuhan mitra di tahun pertama PanganKreatif beroperasi.
            </p>

            <div className="mt-4 rounded-xl bg-white/[0.07] p-3.5 backdrop-blur sm:mt-9 sm:rounded-2xl sm:p-5">
              <div className="text-xs font-medium text-white/60">
                Target Pertumbuhan UMKM Mitra (Tahap 1)
              </div>

              <div className="mt-3 flex items-end gap-2.5 sm:mt-4 sm:gap-3">
                {kuartal.map((k, i) => (
                  <div key={k.label} className="flex flex-1 flex-col items-center gap-1.5 sm:gap-2">
                    <span className="text-[11px] font-semibold text-white/85">
                      {k.umkm}
                    </span>

                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${(k.umkm / maks) * 100}%` }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.7, delay: 0.2 + i * 0.12, ease: "easeOut" }}
                      className="w-full rounded-t-md bg-gradient-to-t from-leaf-dark to-leaf"
                      style={{ minHeight: 8, maxHeight: 96 }}
                    />

                    <span className="text-[11px] text-white/50">{k.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-white/50 sm:mt-5">
              <MapPin size={13} className="shrink-0 text-leaf" />
              <span>
                <strong className="text-white/80">Fokus Regional:</strong> Lhokseumawe, Aceh Utara, Bireuen, Pidie, dan Bener Meriah
              </span>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {target.map((t, i) => {
              const Icon = t.icon;

              return (
                <motion.div
                  key={t.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: i * 0.09 }}
                  className="group rounded-lg sm:rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 backdrop-blur transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 hover:shadow-lg sm:p-6"
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md sm:h-11 sm:w-11 sm:rounded-xl ${t.bg} ${t.color} transition-transform group-hover:scale-110`}>
                    <Icon size={12} strokeWidth={1.75} className="sm:hidden" />
                    <Icon size={20} strokeWidth={1.75} className="hidden sm:block" />
                  </span>

                  <div className="mt-2 font-display text-lg font-bold sm:mt-4 sm:text-3xl lg:text-4xl">
                    <CountUp value={t.angka} suffix={t.akhiran} />
                  </div>

                  <div className="mt-0.5 text-[11.5px] font-medium text-white/90 sm:mt-1 sm:text-sm">{t.label}</div>
                  <div className="mt-0.5 text-[10px] leading-relaxed text-white/50 sm:text-xs">
                    {t.sub}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}