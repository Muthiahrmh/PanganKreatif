"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Store,
  Sprout,
  ShieldCheck,
  Eye,
  Zap,
  MonitorSmartphone, // <-- Kita ubah ikonnya di sini
} from "lucide-react";
import { DashboardMockup } from "./DashboardMockup";
import { PhoneMockup } from "./PhoneMockup";

const penanda = [
  { icon: ShieldCheck, label: "Aman & Terpercaya" },
  { icon: Eye, label: "Transparan" },
  { icon: Zap, label: "Efisien" },
  { icon: Sparkles, label: "Berbasis AI" },
];

export function Hero() {
  return (
    <section id="beranda" className="relative overflow-hidden bg-pola-tani-halus">
      <div className="pointer-events-none absolute -right-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-teal/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-40 h-[30rem] w-[30rem] rounded-full bg-leaf/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1700px] px-6 pb-20 pt-14 sm:px-8 lg:px-16 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-leaf/25 bg-white px-3.5 py-1.5 text-xs font-medium text-leaf-dark">
              <Sparkles size={13} />
              AI Demand Forecasting &amp; B2B Supply Chain
            </span>

            <h1 className="mt-5 font-display text-3xl font-bold leading-[1.15] text-soil sm:text-4xl lg:text-[2.9rem]">
              <span className="text-leaf-dark">Prediksi</span> Lebih Cerdas,
              <br />
              <span className="text-teal">Rantai Pasok</span> Lebih Kuat,
              <br />
              Usaha Kuliner Makin Hebat
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-relaxed text-ink-soft sm:text-base">
              Dari sawah dan laut Aceh sampai dapur warung. PanganKreatif memprediksi
              kebutuhan bahan bakumu, mempertemukanmu dengan kelompok tani, lalu
              menggabungkan pesanan supaya harganya jadi harga grosir.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href="/register?role=umkm"
                className="group rounded-2xl border border-teal/20 bg-white p-4 transition hover:border-teal hover:shadow-lg hover:shadow-teal/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-soft text-teal-dark">
                  <Store size={18} />
                </span>

                <div className="mt-3 text-xs font-medium text-ink-soft">Daftar sebagai</div>
                <div className="font-display text-base font-bold text-teal-dark">
                  UMKM Kuliner
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  Tahu berapa yang perlu dibeli, dari siapa, dan kapan.
                </p>

                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-dark">
                  Mulai sekarang
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>

              <Link
                href="/register?role=supplier"
                className="group rounded-2xl border border-leaf/20 bg-white p-4 transition hover:border-leaf hover:shadow-lg hover:shadow-leaf/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-leaf-soft text-leaf-dark">
                  <Sprout size={18} />
                </span>

                <div className="mt-3 text-xs font-medium text-ink-soft">Daftar sebagai</div>
                <div className="font-display text-base font-bold text-leaf-dark">
                  Kelompok Tani / Distributor
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  Satu pengiriman melayani banyak pembeli sekaligus.
                </p>

                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-leaf-dark">
                  Mulai sekarang
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
              {penanda.map((p) => {
                const Icon = p.icon;
                return (
                  <span
                    key={p.label}
                    className="inline-flex items-center gap-1.5 text-xs text-ink-soft"
                  >
                    <Icon size={14} className="text-leaf" />
                    {p.label}
                  </span>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            <DashboardMockup />

            <motion.div
              initial={{ opacity: 0, y: 24, rotate: -6 }}
              animate={{ opacity: 1, y: 0, rotate: -4 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="pointer-events-none absolute -bottom-10 -right-4 z-10 hidden sm:block"
            >
              <PhoneMockup />
            </motion.div>

            {/* Bagian teks HP diubah menjadi HP & PC */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-8 lg:mt-10"
            >
              <a
                href="#pasang"
                className="group inline-flex items-center gap-3 transition-opacity hover:opacity-80"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-soft px-3.5 py-1.5 text-xs font-semibold text-leaf-dark shadow-sm transition-transform group-hover:scale-105">
                  <MonitorSmartphone size={13} />
                  Bisa dipasang di HP & PC
                </span>

                <span className="text-xs font-medium text-ink-soft group-hover:text-ink">
                  Akses dari layar utama atau desktop &rarr;
                </span>
              </a>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}