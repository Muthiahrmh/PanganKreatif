"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { BrainCircuit, ArrowRight } from "lucide-react";

const roles = [
  {
    type: "image" as const,
    image: "/images/supplier.png",
    title: "Distributor / Petani",
    desc: "Menyediakan bahan baku berkualitas dengan harga kompetitif.",
    color: "border-brand-green/20",
  },
  {
    type: "image" as const,
    image: "/images/logo.png",
    title: "PanganKreatif Platform",
    desc: "Mengelola data, memprediksi kebutuhan, dan menghubungkan kedua pihak.",
    color: "from-brand-blue to-brand-green",
  },
  {
    type: "image" as const,
    image: "/images/umkm_kuliner.png",
    title: "UMKM Kuliner",
    desc: "Mendapatkan bahan baku tepat waktu untuk bisnis yang lebih maju.",
    color: "border-brand-blue/20",
  },
];

export function PlatformRoles() {
  return (
    <section id="manfaat" className="border-t border-ink/5 bg-paper-soft">
      <div className="mx-auto w-full max-w-[1700px] px-8 py-20 lg:px-160">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">
            Satu Platform, Tiga Peran
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-soft">
            Menghubungkan rantai pasok bahan baku kuliner dari hulu ke hilir.
          </p>
        </motion.div>

        <div className="mt-14 flex flex-col items-center justify-center gap-6 md:flex-row md:gap-4">
          {roles.map((role, i) => (
            <div key={role.title} className="flex items-center gap-4 md:gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ y: -6 }}
                className="flex w-44 flex-col items-center text-center"
              >
                {role.type === "image" ? (
                  <div className="relative h-28 w-36">
                    <Image
                      src={role.image}
                      alt={role.title}
                      fill
                      sizes="144px"
                      className="object-contain"
                    />
                  </div>
                ) : (
                <span
                  className={`flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${role.color} text-white shadow-lg`}
                >
                  <BrainCircuit size={36} strokeWidth={1.7} />
                </span>
              )}

                <h3 className="mt-4 font-display text-sm font-bold text-ink">
                  {role.title}
                </h3>

                <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                  {role.desc}
                </p>
              </motion.div>

              {i < roles.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.15 + 0.3,
                  }}
                  className="hidden md:block"
                >
                  <ArrowRight
                    className="text-brand-blue/30"
                    size={22}
                  />
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}