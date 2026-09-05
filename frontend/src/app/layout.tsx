import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono, Caveat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Font tulisan-tangan, dipakai sangat hemat untuk aksen coretan/panah
// dekoratif di landing page (terinspirasi gaya Outseta) — bukan buat teks utama.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PanganKreatif — Rantai Pasok Bahan Baku Kuliner Berbasis AI",
  description:
    "Platform B2B yang menghubungkan UMKM kuliner dengan kelompok tani lewat AI Demand Forecasting dan Collective Procurement.",
};

export const viewport = {
    themeColor: "#16A34A",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${plexMono.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
