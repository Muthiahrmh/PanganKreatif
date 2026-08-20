"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, Store, Truck, ShieldCheck, Eye, Zap, BrainCircuit } from "lucide-react";
import { DashboardMockup } from "./DashboardMockup";
import { PhoneMockup } from "./PhoneMockup";

const trustBadges = [
  { icon: ShieldCheck, label: "Aman & Terpercaya" },
  { icon: Eye, label: "Transparan" },
  { icon: Zap, label: "Efisien" },
  { icon: BrainCircuit, label: "Berbasis AI" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-white to-paper-soft">
      <div className="mx-auto grid w-full max-w-[1700px] gap-16 px-8 py-16 lg:grid-cols-2 lg:px-16 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-4 py-1.5 text-xs font-semibold text-brand-blue">
            <Sparkles size={14} />
            AI Demand Forecasting &amp; B2B Supply Chain Platform
          </span>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.15] tracking-tight md:text-5xl">
            <span className="text-ink">Prediksi Lebih Cerdas,</span>
            <br />
            <span className="text-brand-blue">Rantai Pasok Lebih Kuat,</span>
            <br />
            <span className="text-brand-green">Usaha Kuliner Makin Hebat</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-soft">
            PanganKreatif menghubungkan UMKM Kuliner dengan Distributor/Petani dalam satu
            ekosistem terintegrasi berbasis AI untuk memastikan ketersediaan bahan baku,
            harga kompetitif, dan bisnis yang berkelanjutan.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-brand-blue/15 bg-brand-blue/5 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-ink-soft">Daftar sebagai</div>
                  <div className="font-display text-base font-bold text-ink">UMKM Kuliner</div>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                  <Store size={18} />
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                Dapatkan rekomendasi kebutuhan bahan baku, temukan supplier terbaik, dan kelola
                pesanan dengan mudah.
              </p>
              <Link
                href="/register?role=umkm"
                className="mt-4 inline-flex items-center gap-1 rounded-full bg-brand-blue-dark px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
              >
                Daftar sebagai UMKM →
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-brand-green/15 bg-brand-green/5 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-ink-soft">Daftar sebagai</div>
                  <div className="font-display text-base font-bold text-ink">
                    Distributor / Supplier
                  </div>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                  <Truck size={18} />
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                Pasarkan produk Anda ke lebih banyak UMKM, terima pesanan, dan tingkatkan
                penjualan.
              </p>
              <Link
                href="/register?role=supplier"
                className="mt-4 inline-flex items-center gap-1 rounded-full bg-brand-green-dark px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
              >
                Daftar sebagai Supplier →
              </Link>
            </motion.div>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {trustBadges.map((b) => {
              const Icon = b.icon;
              return (
                <span key={b.label} className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                  <Icon size={15} className="text-brand-green" />
                  {b.label}
                </span>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          className="relative flex items-center justify-center"
        >
          <div className="w-full">
            <DashboardMockup />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16, x: 16 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="absolute -bottom-6 -right-0 hidden lg:block"
          >
            <PhoneMockup />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
