"use client";

import { Bot, TrendingUp } from "lucide-react";

const items = [
  { name: "Cabai Merah", note: "Dipesan 25 kg" },
  { name: "Tomat", note: "Dipesan 18 kg" },
  { name: "Bawang Putih", note: "Dipesan 20 kg" },
];

export function PhoneMockup() {
  return (
    <div className="w-44 overflow-hidden rounded-[1.75rem] border-4 border-navy bg-white shadow-2xl">
      <div className="bg-gradient-to-br from-brand-blue to-brand-green p-3 pb-8 text-white">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold">
          <span className="flex h-4 w-4 items-center justify-center rounded bg-white/20">
            <TrendingUp size={10} />
          </span>
          Prediksi Minggu Depan
        </div>
        <div className="mt-2 text-xl font-bold">+18%</div>
        <div className="text-[9px] text-white/80">Permintaan Meningkat</div>
      </div>

      <div className="-mt-4 rounded-t-2xl bg-white p-3">
        <div className="mb-2 text-[9px] font-semibold text-ink-soft">
          Rekomendasi Untuk Anda
        </div>
        <div className="flex flex-col gap-2">
          {items.map((it) => (
            <div key={it.name} className="flex items-center gap-2 rounded-lg bg-paper-soft p-1.5">
              <span className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-green/40 to-brand-blue/40" />
              <div className="text-[8px] leading-tight">
                <div className="font-medium text-ink">{it.name}</div>
                <div className="text-ink-soft">{it.note}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-navy py-1.5 text-[9px] font-semibold text-white">
          <Bot size={11} /> Lihat Detail
        </div>
      </div>
    </div>
  );
}
