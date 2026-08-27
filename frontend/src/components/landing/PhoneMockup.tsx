"use client";

import { Sparkles, Bell, ShoppingCart, TrendingUp } from "lucide-react";

/**
 * Cuplikan tampilan di layar ponsel.
 *
 * Isi dan warnanya mengikuti beranda UMKM yang sebenarnya — biru
 * untuk sisi pembeli, kartu AI Insight bergradasi, lalu rekomendasi
 * pembelian. Dibuat senada dengan kartu dashboard di sebelahnya
 * supaya terbaca sebagai satu produk yang sama.
 */
const rekomendasi = [
  { nama: "Cabai Merah", prediksi: "66 kg", hemat: "hemat Rp297rb" },
  { nama: "Bawang Merah", prediksi: "42 kg", hemat: "hemat Rp158rb" },
];

export function PhoneMockup() {
  return (
    <div className="w-[9.5rem] overflow-hidden rounded-[1.6rem] border-[5px] border-navy bg-paper-soft shadow-2xl ring-1 ring-black/5">
      {/* Topbar, meniru dashboard sebenarnya */}
      <div className="flex items-center justify-between bg-white px-2.5 py-2">
        <div className="text-[9px] font-bold text-ink">Beranda</div>

        <div className="flex items-center gap-1.5">
          <Bell size={9} className="text-ink-soft" />
          <span className="h-4 w-4 rounded-full bg-brand-blue" />
        </div>
      </div>

      <div className="space-y-1.5 p-2">
        {/* Kartu AI Insight */}
        <div className="rounded-lg bg-gradient-to-br from-brand-blue to-brand-green p-2 text-white">
          <div className="flex items-center gap-1 text-[8px] font-semibold">
            <Sparkles size={8} />
            AI Insight
          </div>

          <div className="mt-1 font-display text-base font-bold leading-none">66 kg</div>
          <div className="mt-0.5 text-[7px] text-white/85">
            Cabai Merah · naik 8% bulan depan
          </div>
        </div>

        {/* Dua kartu ringkas */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-lg bg-white p-1.5">
            <div className="text-[7px] text-ink-soft">Pesanan Aktif</div>
            <div className="text-[11px] font-bold text-ink">2</div>
          </div>

          <div className="rounded-lg bg-white p-1.5">
            <div className="text-[7px] text-ink-soft">Hemat</div>
            <div className="text-[11px] font-bold text-brand-green">Rp300rb</div>
          </div>
        </div>

        {/* Rekomendasi pembelian */}
        <div className="rounded-lg bg-white p-2">
          <div className="mb-1.5 flex items-center gap-1 text-[8px] font-semibold text-ink">
            <Sparkles size={8} className="text-brand-blue" />
            Rekomendasi Pembelian
          </div>

          <div className="flex flex-col gap-1.5">
            {rekomendasi.map((r) => (
              <div key={r.nama} className="flex items-center gap-1.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[8px] font-medium text-ink">{r.nama}</div>
                  <div className="text-[7px] text-brand-green">{r.hemat}</div>
                </div>

                <span className="shrink-0 text-[8px] font-bold text-brand-blue">
                  {r.prediksi}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-center gap-1 rounded-md bg-brand-blue py-1 text-[8px] font-semibold text-white">
            <ShoppingCart size={8} /> Gabung Pesanan
          </div>
        </div>

        {/* Progres menuju harga grosir */}
        <div className="rounded-lg bg-white p-2">
          <div className="flex items-center justify-between text-[7px]">
            <span className="font-medium text-ink">Menuju Harga Grosir</span>
            <span className="text-ink-soft">47/60 kg</span>
          </div>

          <div className="mt-1 h-1 rounded-full bg-slate-100">
            <div className="h-1 w-[78%] rounded-full bg-brand-green" />
          </div>

          <div className="mt-1 flex items-center gap-0.5 text-[7px] text-ink-soft">
            <TrendingUp size={7} className="text-brand-green" />
            Kurang 13 kg lagi
          </div>
        </div>
      </div>
    </div>
  );
}