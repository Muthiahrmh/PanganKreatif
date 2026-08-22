"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Store,
  Network,
  LineChart,
  ShieldCheck,
  Headset,
} from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "AI Demand Forecasting",
    desc: "Prediksi kebutuhan bahan baku dari riwayat penjualan, pola musiman, dan hari libur nasional.",
  },
  {
    icon: Store,
    title: "Perbandingan Pemasok",
    desc: "Bandingkan harga, stok, jarak, dan estimasi pengiriman dari beberapa pemasok sekaligus.",
  },
  {
    icon: Network,
    title: "Belanja Kolektif",
    desc: "Beli bersama UMKM lain supaya kuota grosir tercapai dan harga per satuan turun.",
  },
  {
    icon: LineChart,
    title: "Analitik & Insight",
    desc: "Pantau penghematan, tren permintaan, dan performa bisnis dari satu dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Aman & Transparan",
    desc: "Potongan komisi ditampilkan terbuka, dan penerusan dana ke pemasok disertai bukti transfer.",
  },
  {
    icon: Headset,
    title: "Dukungan Profesional",
    desc: "Tim kami siap membantu lewat WhatsApp, termasuk pendampingan langsung untuk mitra.",
    tautan: "/bantuan",
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

            const isi = (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue/10 to-brand-green/10 text-brand-blue">
                  <Icon size={24} strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-display text-sm font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">{f.desc}</p>
              </>
            );

            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
              >
                {f.tautan ? (
                  <Link
                    href={f.tautan}
                    className="flex flex-col items-center rounded-2xl p-4 text-center transition hover:bg-paper-soft"
                  >
                    {isi}
                    <span className="mt-2 text-xs font-medium text-brand-blue">
                      Buka pusat bantuan
                    </span>
                  </Link>
                ) : (
                  <div className="flex flex-col items-center rounded-2xl p-4 text-center">
                    {isi}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}