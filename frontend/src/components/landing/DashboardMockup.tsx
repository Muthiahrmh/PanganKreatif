"use client";

import Image from "next/image";
import {
  Home,
  Sparkles,
  Package,
  Users,
  Receipt,
  FileText,
  Bell,
  ChevronDown,
  TrendingUp,
  ShoppingBag,
  Wallet,
  ShieldCheck,
  Star,
  Bot,
} from "lucide-react";
import { MiniChart } from "./MiniChart";

const sidebarItems = [
  { icon: Home, label: "Beranda", active: true },
  { icon: Sparkles, label: "Prediksi AI" },
  { icon: Package, label: "Pesanan" },
  { icon: Users, label: "Supplier" },
  { icon: ShoppingBag, label: "Produk" },
  { icon: Receipt, label: "Transaksi" },
  { icon: FileText, label: "Laporan" },
];

const statCards = [
  { icon: TrendingUp, label: "Prediksi Permintaan", value: "+18%", sub: "Minggu Depan", color: "text-brand-blue" },
  { icon: ShoppingBag, label: "Pesanan Aktif", value: "24", sub: "Pesanan", color: "text-ink" },
  { icon: Wallet, label: "Total Pengeluaran", value: "Rp2.450.000", sub: "+12% dari bulan lalu", color: "text-ink" },
  { icon: ShieldCheck, label: "Stok Aman", value: "85%", sub: "Kategori Aman", color: "text-brand-green" },
];

const suppliers = [
  { name: "Tani Makmur", rating: 4.8, price: "Rp28.000/kg" },
  { name: "Agro Fresh", rating: 4.6, price: "Rp30.000/kg" },
  { name: "Sawah Sejahtera", rating: 4.5, price: "Rp29.000/kg" },
];

const orders = [
  { no: "PO-240514-001", supplier: "Tani Makmur", produk: "Cabai Merah", jumlah: "15 kg", status: "Diproses", statusColor: "bg-amber-100 text-amber-700" },
  { no: "PO-240514-017", supplier: "Agro Fresh", produk: "Bawang Putih", jumlah: "20 kg", status: "Dikirim", statusColor: "bg-blue-100 text-blue-700" },
  { no: "PO-240513-025", supplier: "Sawah Sejahtera", produk: "Tomat", jumlah: "10 kg", status: "Selesai", statusColor: "bg-green-100 text-green-700" },
];

export function DashboardMockup() {
  return (
    <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-navy shadow-2xl">
      {/* Sidebar */}
      <div className="hidden w-44 shrink-0 flex-col bg-navy p-4 sm:flex">
        <div className="mb-6 flex items-center px-1">
          <Image
            src="/images/logo-pangankreatif.png"
            alt="PanganKreatif"
            width={110}
            height={32}
            className="h-6 w-auto brightness-0 invert"
          />
        </div>
        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${item.active
                    ? "bg-brand-green text-white"
                    : "text-white/60"
                  }`}
              >
                <Icon size={15} />
                {item.label}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 bg-paper-soft p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-display text-base font-bold text-ink">Dashboard</span>
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

        {/* Stat cards */}
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

        {/* Chart + Rekomendasi */}
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
            <div className="mb-2 text-[10px] font-semibold text-ink">Rekomendasi Supplier</div>
            <div className="flex flex-col gap-2">
              {suppliers.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-gradient-to-br from-brand-green/30 to-brand-blue/30" />
                    <div className="text-[9px]">
                      <div className="font-medium text-ink">{s.name}</div>
                      <div className="flex items-center gap-0.5 text-ink-soft">
                        <Star size={8} className="fill-amber-400 text-amber-400" />
                        {s.rating}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold text-ink">{s.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Orders + Insight */}
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="mb-2 text-[10px] font-semibold text-ink">Pesanan Terbaru</div>
            <div className="flex flex-col gap-1.5">
              {orders.map((o) => (
                <div key={o.no} className="flex items-center justify-between text-[9px]">
                  <span className="text-ink-soft">{o.produk}</span>
                  <span className="text-ink-soft">{o.jumlah}</span>
                  <span className={`rounded-full px-1.5 py-0.5 font-medium ${o.statusColor}`}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-brand-blue to-brand-green p-3 text-white shadow-sm">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold">
              <Bot size={13} /> Insight AI
            </div>
            <p className="text-[9px] leading-relaxed text-white/90">
              Permintaan cabai merah diprediksi naik 18% minggu depan. Disarankan tambah stok
              15–20%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}