import type { ReactNode } from "react";

interface SectionEyebrowProps {
    children: ReactNode;
    /** Kelas warna teks Tailwind, mis. "text-blue-600" — dipetakan ke
     *  warna titik yang senada lewat DOT di bawah, bukan disusun lewat
     *  string-replace saat runtime, supaya tetap terdeteksi Tailwind. */
    color?: string;
}

const DOT: Record<string, string> = {
    "text-blue-600": "bg-blue-500",
    "text-emerald-600": "bg-emerald-500",
    "text-emerald-700": "bg-emerald-600",
    "text-amber-600": "bg-amber-500",
};
const DOT_DEFAULT = "bg-slate-400";

/** Label kecil huruf kapital di atas tiap seksi dashboard, supaya halaman
 *  yang padat tetap gampang dipindai — dipakai seragam di ketiga
 *  dashboard (UMKM/biru, Tani/hijau, Admin/oranye). */
export function SectionEyebrow({ children, color }: SectionEyebrowProps) {
    const dot = (color && DOT[color]) ?? DOT_DEFAULT;

    return (
        <div className="mb-3 flex items-center gap-2 px-1">
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {children}
            </span>
        </div>
    );
}
