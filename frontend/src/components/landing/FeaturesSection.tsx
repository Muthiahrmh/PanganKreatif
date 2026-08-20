"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Store, Network, LineChart, ShieldCheck, Headphones } from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "AI Demand Forecasting",
    desc: "Prediksi kebutuhan bahan baku akurat berdasarkan data historis dan tren pasar.",
  },
  {
    icon: Store,
    title: "Marketplace B2B",
    desc: "Temukan distributor/petani terbaik dengan harga kompetitif.",
  },
  {
    icon: Network,
    title: "Supply Chain Terintegrasi",
    desc: "Kelola pemesanan, pembayaran, dan pengiriman dalam satu sistem.",
  },
  {
    icon: LineChart,
    title: "Analitik & Insight",
    desc: "Dapatkan insight pasar, tren permintaan, dan performa bisnis secara real-time.",
  },
  {
    icon: ShieldCheck,
    title: "Aman & Transparan",
    desc: "Transaksi aman, data terjaga, dan proses lebih transparan.",
  },
  {
    icon: Headphones,
    title: "Dukungan Profesional",
    desc: "Tim support siap membantu Anda kapan saja.",
  },
];

export function FeaturesSection() {
  return (
    <section id="fitur" className="border-t border-ink/5 bg-white">
      <div className="mx-auto w-full max-w-[1700px] px-8 py-20 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-3"
        >
          <span className="h-px w-10 bg-ink/15" />
          <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">
            Fitur Unggulan PanganKreatif
          </h2>
          <span className="h-px w-10 bg-ink/15" />
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="flex flex-col items-center rounded-2xl p-4 text-center"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue/10 to-brand-green/10 text-brand-blue">
                  <Icon size={24} strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-display text-sm font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
