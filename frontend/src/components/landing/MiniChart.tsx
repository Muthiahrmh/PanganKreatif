"use client";

import { motion } from "framer-motion";

const historis = [20, 35, 40, 55, 60, 75, 80];
const prediksi = [80, 95, 105, 100, 120, 130, 145];

function toPoints(values: number[], width: number, height: number) {
  const max = 150;
  const step = width / (values.length - 1);
  return values
    .map((v, i) => `${i * step},${height - (v / max) * height}`)
    .join(" ");
}

export function MiniChart({ width = 320, height = 110 }: { width?: number; height?: number }) {
  const historisPoints = toPoints(historis, width, height);
  const predStep = width / (prediksi.length - 1);
  const predPointsStr = prediksi
    .map((v, i) => `${i * predStep},${height - (v / 150) * height}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
      <motion.polyline
        points={historisPoints}
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
        points={predPointsStr}
        fill="none"
        stroke="#16a34a"
        strokeWidth={2.5}
        strokeDasharray="5 4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
      />
      {historis.map((v, i) => (
        <circle
          key={`h-${i}`}
          cx={(i * width) / (historis.length - 1)}
          cy={height - (v / 150) * height}
          r={3}
          fill="#2563eb"
        />
      ))}
      {prediksi.map((v, i) => (
        <circle
          key={`p-${i}`}
          cx={(i * width) / (prediksi.length - 1)}
          cy={height - (v / 150) * height}
          r={3}
          fill="#16a34a"
        />
      ))}
    </svg>
  );
}
