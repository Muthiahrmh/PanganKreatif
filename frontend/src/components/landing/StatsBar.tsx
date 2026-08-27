"use client";

import { motion } from "framer-motion";
import { Store, Sprout, Receipt, TrendingDown, MapPin } from "lucide-react";
import { CountUp } from "@/components/ui/CountUp";

const target = [
  {
    icon: Store,
    angka: 300,
    akhiran: "",
    label: "UMKM Kuliner",
    sub: "Warung, kafe, dan katering mitra",
    color: "text-blue-400",
    bg: "bg-blue-400/15"
  },
  {
    icon: Sprout,
    angka: 20,
    akhiran: "",
    label: "Kelompok Tani",
    sub: "Petani, nelayan, dan distributor",
    color: "text-leaf",
    bg: "bg-leaf/15"
  },
  {
    icon: Receipt,
    angka: 2000,
    akhiran: "",
    label: "Transaksi",
    sub: "Sepanjang dua belas bulan pertama",
    color: "text-teal-400",
    bg: "bg-teal-400/15"
  },
  {
    icon: TrendingDown,
    angka: 25,
    akhiran: "%",
    label: "Efisiensi Biaya",
    sub: "Penghematan belanja bahan baku",
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
    <section className="relative overflow-hidden bg-soil py-16 text-white lg:py-20">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-leaf/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-teal/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1700px] px-6 sm:px-8 lg:px-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
              Target Tahun Pertama
            </span>

            <h2 className="mt-4 font-display text-2xl font-bold leading-tight md:text-4xl">
              Yang ingin kami capai
              <br className="hidden sm:block" />{" "}
              <span className="text-leaf">dalam dua belas bulan</span>
            </h2>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
              Sasaran pertumbuhan yang dirancang untuk tahun pertama operasional di
              Lhokseumawe dan kabupaten sekitarnya.
            </p>

            <div className="mt-9 rounded-2xl bg-white/[0.07] p-5 backdrop-blur">
              <div className="text-xs font-medium text-white/60">
                Pertumbuhan UMKM mitra per kuartal
              </div>

              <div className="mt-4 flex items-end gap-3">
                {kuartal.map((k, i) => (
                  <div key={k.label} className="flex flex-1 flex-col items-center gap-2">
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

            <div className="mt-5 flex items-center gap-2 text-xs text-white/50">
              <MapPin size={13} />
              Wilayah awal: Lhokseumawe, Aceh Utara, Bireuen, Pidie, Bener Meriah
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {target.map((t, i) => {
              const Icon = t.icon;

              return (
                <motion.div
                  key={t.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: i * 0.09 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur transition-colors hover:border-white/20 hover:bg-white/10 sm:p-6"
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${t.bg} ${t.color}`}>
                    <Icon size={20} strokeWidth={1.75} />
                  </span>

                  <div className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                    <CountUp value={t.angka} suffix={t.akhiran} />
                  </div>

                  <div className="mt-1 text-sm font-medium text-white/90">{t.label}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-white/50">
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