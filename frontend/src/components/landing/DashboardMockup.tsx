"use client";

import Image from "next/image";
import {
  Home,
  Sparkles,
  Package,
  Store,
  Receipt,
  ShoppingCart,
  NotebookPen,
  Bell,
  ChevronDown,
  TrendingUp,
  PiggyBank,
  Bot,
} from "lucide-react";
import { MiniChart } from "./MiniChart";

/**
 * Cuplikan tampilan dashboard untuk halaman depan.
 *
 * Isinya sengaja mengikuti aplikasi yang sebenarnya — menu, kartu,
 * dan angkanya mencerminkan fitur yang memang ada. Menampilkan
 * sesuatu yang belum dibangun, misalnya rating pemasok atau
 * persentase stok, hanya akan mengecewakan orang yang mencoba.
 */

const sidebarItems = [
  { icon: Home, label: "Beranda", active: true },
  { icon: NotebookPen, label: "Riwayat Penjualan" },
  { icon: Sparkles, label: "Prediksi AI" },
  { icon: Store, label: "Cari Pemasok" },
  { icon: ShoppingCart, label: "Belanja Kolektif" },
  { icon: Receipt, label: "Transaksi" },
];

const statCards = [
  { icon: NotebookPen, label: "Data Penjualan", value: "162", sub: "3 bahan baku", color: "text-brand-blue" },
  { icon: Sparkles, label: "Prediksi Bulan Depan", value: "66 kg", sub: "Cabai Merah", color: "text-brand-green" },
  { icon: ShoppingCart, label: "Pesanan Aktif", value: "2", sub: "Belanja kolektif", color: "text-ink" },
  { icon: PiggyBank, label: "Hemat Kolektif", value: "Rp300.000", sub: "Dibanding harga satuan", color: "text-amber-500" },
];

/** Rekomendasi pembelian — beberapa bahan sekaligus, seperti di aplikasi */
const rekomendasi = [
  { bahan: "Cabai Merah", prediksi: "66 kg", arah: "naik 8%", pemasok: "Tani Makmur", harga: "Rp35.000" },
  { bahan: "Bawang Merah", prediksi: "42 kg", arah: "stabil", pemasok: "Tani Jaya", harga: "Rp26.500" },
  { bahan: "Minyak Goreng", prediksi: "58 lt", arah: "naik 5%", pemasok: "Sembako Aceh", harga: "Rp18.000" },
];

/** Progres menuju harga grosir — inti dari belanja kolektif */
const kolektif = [
  { produk: "Cabai Merah", terkumpul: 47, target: 60, satuan: "kg", umkm: 4 },
  { produk: "Bawang Merah", terkumpul: 37, target: 50, satuan: "kg", umkm: 3 },
];

export function DashboardMockup() {
  return (
    <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-navy shadow-2xl">
      {/* Sidebar */}
      <div className="hidden w-44 shrink-0 flex-col bg-navy p-4 sm:flex">
        <div className="mb-4 flex items-center px-1">
          <Image
            src="/images/logo-pangankreatif.png"
            alt="PanganKreatif"
            width={110}
            height={32}
            className="h-6 w-auto brightness-0 invert"
          />
        </div>

        <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-blue/25 px-2 py-0.5 text-[9px] font-medium text-white">
          <span className="h-1 w-1 rounded-full bg-brand-blue" />
          Sisi Pembeli
        </div>

        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${item.active ? "bg-brand-blue text-white" : "text-white/60"
                  }`}
              >
                <Icon size={15} />
                {item.label}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Isi */}
      <div className="flex-1 bg-paper-soft p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-display text-base font-bold text-ink">Beranda</span>
          <div className="flex items-center gap-3">
            <Bell size={16} className="text-ink-soft" />
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-blue to-brand-green" />
              <div className="hidden text-[10px] leading-tight sm:block">
                <div className="font-semibold text-ink">Dapur Lezat</div>
                <div className="text-ink-soft">UMKM Kuliner</div>
              </div>
              <ChevronDown size={12} className="text-ink-soft" />
            </div>
          </div>
        </div>

        {/* Kartu ringkas */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-lg bg-white p-2.5 shadow-sm">
                <div className="text-[9px] text-ink-soft">{s.label}</div>
                <div className={`mt-0.5 flex items-center gap-1 text-sm font-bold ${s.color}`}>
                  {s.value}
                  <Icon size={12} />
                </div>
                <div className="text-[9px] text-ink-soft">{s.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Grafik prediksi + rekomendasi beberapa bahan */}
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-ink">
              Prediksi Permintaan Bahan Baku
              <span className="rounded bg-paper-soft px-1.5 py-0.5 text-ink-soft">Cabai Merah</span>
            </div>
            <div className="mb-1 flex gap-3 text-[9px] text-ink-soft">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" /> Data Historis
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-green" /> Prediksi AI
              </span>
            </div>
            <MiniChart width={280} height={80} />
          </div>

          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-1 text-[10px] font-semibold text-ink">
              <Sparkles size={11} className="text-brand-blue" />
              Rekomendasi Pembelian
            </div>

            <div className="flex flex-col gap-2">
              {rekomendasi.map((r) => (
                <div key={r.bahan} className="flex items-start justify-between gap-2">
                  <div className="min-w-0 text-[9px]">
                    <div className="font-medium text-ink">{r.bahan}</div>
                    <div className="truncate text-ink-soft">
                      termurah {r.pemasok}
                    </div>
                  </div>

                  <div className="shrink-0 text-right text-[9px]">
                    <div className="font-semibold text-brand-blue">{r.prediksi}</div>
                    <div className="text-ink-soft">{r.harga}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progres harga grosir + insight */}
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-1 text-[10px] font-semibold text-ink">
              <Package size={11} className="text-brand-green" />
              Menuju Harga Grosir
            </div>

            <div className="flex flex-col gap-2.5">
              {kolektif.map((k) => {
                const persen = Math.min((k.terkumpul / k.target) * 100, 100);
                return (
                  <div key={k.produk}>
                    <div className="flex items-baseline justify-between text-[9px]">
                      <span className="text-ink">{k.produk}</span>
                      <span className="text-ink-soft">
                        {k.terkumpul}/{k.target} {k.satuan}
                      </span>
                    </div>

                    <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-brand-green"
                        style={{ width: `${persen}%` }}
                      />
                    </div>

                    <div className="mt-0.5 text-[9px] text-ink-soft">
                      {k.umkm} UMKM bergabung · kurang {k.target - k.terkumpul} {k.satuan} lagi
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-brand-blue to-brand-green p-3 text-white shadow-sm">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold">
              <Bot size={13} /> Insight AI
            </div>
            <p className="text-[9px] leading-relaxed text-white/90">
              Kebutuhan Cabai Merah diperkirakan naik 8% dibanding rata-rata tiga bulan
              terakhir. Gabung belanja kolektif, kurang 13 kg lagi harga turun jadi
              Rp30.500/kg.
            </p>

            <div className="mt-2 flex items-center gap-1 text-[9px] text-white/80">
              <TrendingUp size={10} />
              Hemat sampai Rp297.000
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}