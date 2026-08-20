"use client";

import { motion } from "framer-motion";
import { Users, Tractor, ShoppingCart, TrendingUp, ShieldCheck } from "lucide-react";
import { CountUp } from "@/components/ui/CountUp";

const stats = [
  { icon: Users, value: 1250, suffix: "+", label: "UMKM Kuliner Bergabung", color: "text-brand-blue" },
  { icon: Tractor, value: 320, suffix: "+", label: "Distributor / Petani Aktif", color: "text-brand-green" },
  { icon: ShoppingCart, value: 8450, suffix: "+", label: "Transaksi Berhasil", color: "text-brand-blue" },
  { icon: TrendingUp, value: 18, suffix: "%", label: "Rata-rata Peningkatan Efisiensi", color: "text-brand-green" },
  { icon: ShieldCheck, value: 99.9, suffix: "%", label: "Uptime & Keamanan Terjamin", color: "text-brand-blue" },
];

export function StatsBar() {
  return (
    <section className="border-t border-ink/5 bg-white">
      <div className="mx-auto w-full max-w-[1700px] px-8 py-20 lg:px-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="flex items-center gap-3"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper-soft">
                  <Icon size={20} className={s.color} />
                </span>
                <div>
                  <div className={`font-display text-lg font-bold ${s.color}`}>
                    <CountUp value={s.value} suffix={s.suffix} decimals={s.value % 1 !== 0 ? 1 : 0} />
                  </div>
                  <div className="text-xs leading-tight text-ink-soft">{s.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
