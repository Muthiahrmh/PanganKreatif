"use client";

import { motion } from "framer-motion";

const historis = [38, 42, 40, 58, 65, 49, 52, 61];
const prediksi = 66;
const MAKS = 80;

export function MiniChart({ width = 320, height = 110 }: { width?: number; height?: number }) {
  const lebarHistoris = width * 0.8;
  const langkah = lebarHistoris / (historis.length - 1);

  const y = (nilai: number) => height - (nilai / MAKS) * height;

  const titikHistoris = historis.map((v, i) => ({ x: i * langkah, y: y(v) }));
  const titikAkhir = titikHistoris[titikHistoris.length - 1];
  const titikPrediksi = { x: width, y: y(prediksi) };

  const garisHistoris = titikHistoris.map((t) => `${t.x},${t.y}`).join(" ");
  const garisPrediksi = `${titikAkhir.x},${titikAkhir.y} ${titikPrediksi.x},${titikPrediksi.y}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
      <motion.polyline
        points={garisHistoris}
        fill="none"
        stroke="#2563eb"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      <motion.polyline
        points={garisPrediksi}
        fill="none"
        stroke="#16a34a"
        strokeWidth={2.5}
        strokeDasharray="5 4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 1.1 }}
      />

      {titikHistoris.map((t, i) => (
        <circle key={`h-${i}`} cx={t.x} cy={t.y} r={3} fill="#2563eb" />
      ))}

      <motion.circle
        cx={titikPrediksi.x}
        cy={titikPrediksi.y}
        r={4}
        fill="#ffffff"
        stroke="#16a34a"
        strokeWidth={2.5}
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: 1.7 }}
      />
    </svg>
  );
}