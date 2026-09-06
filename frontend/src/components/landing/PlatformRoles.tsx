"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Sprout, Cpu, Store } from "lucide-react";

/**
 * Tiga peran dalam satu rantai pasok.
 *
 * Urutannya hulu ke hilir: petani, platform, UMKM. Kartu tengah
 * dibuat berlatar gelap karena platform memang berada di antara
 * keduanya — posisinya berbeda, jadi tampilannya juga harus berbeda.
 */
const roles = [
  {
    image: "/images/supplier1.png",
    icon: Sprout,
    title: "Distributor / Petani",
    posisi: "Hulu",
    desc: "Menyediakan bahan baku hasil panen dan tangkapan laut.",
    poin: [
      "Terima pesanan yang sudah terkumpul",
      "Satu pengiriman, banyak pembeli",
      "Dana masuk disertai bukti transfer",
    ],
    warna: "#5CA935",
    latar: "#EEF7E8",
  },
  {
    image: "/images/logo.png",
    icon: Cpu,
    title: "PanganKreatif",
    posisi: "Penghubung",
    desc: "Memprediksi, mengelola, dan menjembatani kedua sisi.",
    poin: [
      "Prediksi kebutuhan bahan baku",
      "Gabungkan pesanan jadi kuota grosir",
      "Tampung dana, teruskan ke pemasok",
    ],
    warna: "#22C55E", // Hijau terang identitas sistem
    latar: "#F0FDF4",
    utama: true,
  },
  {
    image: "/images/umkm_kuliner1.png",
    icon: Store,
    title: "UMKM Kuliner",
    posisi: "Hilir",
    desc: "Warung, kafe, katering, dan rumah makan.",
    poin: [
      "Tahu berapa yang perlu dibeli",
      "Dapat harga grosir tanpa pesan besar",
      "Bandingkan harga, jarak, dan stok",
    ],
    warna: "#2563EB", // Biru identitas UMKM
    latar: "#EFF6FF",
  },
];

export function PlatformRoles() {
  return (
    <section id="peran" className="relative isolate overflow-hidden bg-white">
      {/* Cahaya ambient lembut — supaya bagian berlatar putih ini tidak
          terasa datar dibanding section lain yang sudah bergradasi/bertekstur */}
      <div className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-leaf-soft/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-teal-soft/60 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1700px] px-5 py-10 sm:px-8 sm:py-20 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-teal-dark">
            Ekosistem
          </span>

          <h2 className="mt-3 font-display text-xl font-bold leading-tight text-soil sm:mt-4 sm:text-3xl md:text-4xl">
            Satu Platform, <span className="text-teal-dark">Tiga Peran</span>
          </h2>

          <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-soft sm:mt-4 sm:text-base">
            Menghubungkan rantai pasok bahan baku kuliner dari hulu ke hilir, tanpa
            perantara yang memanjangkan jalur dan menaikkan harga.
          </p>
        </motion.div>

        <div className="mt-5 grid gap-2.5 sm:mt-14 sm:gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
          {roles.map((role, i) => {
            const Icon = role.icon;

            return (
              <div key={role.title} className="contents">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl p-3.5 transition-all hover:-translate-y-1 sm:rounded-3xl sm:p-7 ${role.utama
                      ? "bg-gradient-to-br from-[#16241B] via-[#1F4D33] to-[#0B5F7D] text-white shadow-xl shadow-soil/10 lg:scale-105"
                      : "border border-ink/5 bg-cream hover:shadow-lg hover:shadow-soil/5"
                    }`}
                >
                  {role.utama && (
                    <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/5" />
                  )}

                  {/* PERBAIKAN: di HP, gambar peran ditaruh sebaris dengan
                      judul (bukan gambar besar terpisah di tengah) supaya
                      tingginya jauh lebih ringkas — tiga kartu ini kalau
                      ditumpuk ke bawah jadi kepanjangan kalau tiap kartu
                      masih setinggi versi desktop. */}
                  <div className="relative flex items-center gap-3 sm:flex-col sm:items-stretch sm:gap-0">
                    <div className="relative h-10 w-10 shrink-0 transition-transform group-hover:scale-105 sm:mx-auto sm:mt-5 sm:h-56 sm:w-56 lg:h-52 lg:w-52 xl:h-60 xl:w-60">
                      <Image
                        src={role.image}
                        alt={role.title}
                        fill
                        sizes="(min-width: 1280px) 240px, (min-width: 640px) 224px, 40px"
                        className="object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1 sm:hidden">
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                        style={
                          role.utama
                            ? { backgroundColor: "rgba(255,255,255,0.12)", color: "#FFFFFF" }
                            : { backgroundColor: role.latar, color: role.warna }
                        }
                      >
                        {role.posisi}
                      </span>
                      <h3 className={`mt-1 font-display text-[15px] font-bold leading-snug ${role.utama ? "text-white" : "text-soil"}`}>
                        {role.title}
                      </h3>
                    </div>
                  </div>

                  <div className="relative mt-2 hidden items-start justify-between gap-3 sm:flex">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={
                        role.utama
                          ? { backgroundColor: "rgba(255,255,255,0.12)", color: "#FFFFFF" }
                          : { backgroundColor: role.latar, color: role.warna }
                      }
                    >
                      <Icon size={18} strokeWidth={1.75} />
                    </span>

                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={
                        role.utama
                          ? { backgroundColor: "rgba(255,255,255,0.12)", color: "#FFFFFF" }
                          : { backgroundColor: role.latar, color: role.warna }
                      }
                    >
                      {role.posisi}
                    </span>
                  </div>

                  <h3
                    className={`relative mt-5 hidden font-display text-lg font-bold sm:block ${role.utama ? "text-white" : "text-soil"
                      }`}
                  >
                    {role.title}
                  </h3>

                  <p
                    className={`relative mt-1.5 text-[12px] leading-relaxed sm:mt-1.5 sm:text-sm ${role.utama ? "text-white/75" : "text-ink-soft"
                      }`}
                  >
                    {role.desc}
                  </p>

                  <div
                    className={`relative mt-2.5 flex flex-col gap-1.5 border-t pt-2.5 sm:mt-5 sm:gap-2.5 sm:pt-5 ${role.utama ? "border-white/15" : "border-ink/8"
                      }`}
                  >
                    {role.poin.map((p) => (
                      <div key={p} className="flex items-start gap-2">
                        <span
                          className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full sm:mt-1.5"
                          style={{
                            backgroundColor: role.utama ? "#5CA935" : role.warna,
                          }}
                        />
                        <span
                          className={`text-[11px] leading-relaxed sm:text-xs ${role.utama ? "text-white/80" : "text-ink-soft"
                            }`}
                        >
                          {p}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Panah penghubung: mendatar di layar lebar,
                    menurun saat kartu ditumpuk */}
                {i < roles.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4, delay: i * 0.12 + 0.35 }}
                    className="flex items-center justify-center py-0.5 lg:py-0"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-leaf-soft text-leaf-dark sm:h-9 sm:w-9">
                      <ArrowDown size={11} className="sm:hidden" />
                      <ArrowDown size={16} className="hidden sm:block lg:hidden" />
                      <ArrowRight size={16} className="hidden lg:block" />
                    </span>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}