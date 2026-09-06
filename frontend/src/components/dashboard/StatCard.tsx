import { LucideIcon } from "lucide-react";

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string; // contoh: "50,32 kg" atau "240 catatan"
    sub: string;
    color?: string;
    /** Data tren kecil (opsional) buat sparkline mini ala kartu laporan
     *  Outseta — cuma dipakai kalau memang ada histori data asli yang
     *  sudah diambil (bukan angka rekaan), jadi kartu yang tidak
     *  mengirim prop ini tampil persis seperti sebelumnya. */
    trend?: number[];
}

/** Sparkline mini polos dari SVG — mewarisi warna teks induknya lewat
 *  currentColor, jadi otomatis senada dengan aksen tiap kartu. */
function MiniSparkline({ data }: { data: number[] }) {
    if (data.length < 2) return null;

    const w = 64;
    const h = 22;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const jarak = max - min || 1;
    const langkah = w / (data.length - 1);
    const titik = data
        .map((v, i) => `${i * langkah},${h - ((v - min) / jarak) * h}`)
        .join(" ");

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
            <polyline
                points={titik}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.55}
            />
        </svg>
    );
}

// Warna teks (dipakai buat angka) dipetakan ke latar ikon & garis aksen
// yang senada. Ditulis sebagai kelas literal (bukan disusun lewat
// string-replace saat runtime) supaya tetap terdeteksi oleh Tailwind.
const TINT: Record<string, { chip: string; bar: string }> = {
    "text-blue-600": { chip: "bg-blue-50", bar: "bg-blue-500" },
    "text-emerald-600": { chip: "bg-emerald-50", bar: "bg-emerald-500" },
    "text-emerald-700": { chip: "bg-emerald-50", bar: "bg-emerald-600" },
    "text-amber-600": { chip: "bg-amber-50", bar: "bg-amber-500" },
    "text-red-600": { chip: "bg-red-50", bar: "bg-red-500" },
};
const TINT_DEFAULT = { chip: "bg-slate-50", bar: "bg-slate-300" };

export function StatCard({ icon: Icon, label, value, sub, color = "text-blue-600", trend }: StatCardProps) {
    // Memisahkan angka dengan teks satuannya secara otomatis
    const parts = value.split(" ");
    const angka = parts[0] || "";
    const satuan = parts.slice(1).join(" ") || "";
    const tint = TINT[color] ?? TINT_DEFAULT;

    return (
        <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5">
            {/* Garis aksen tipis di tepi atas, senada dengan warna kartu */}
            <span className={`absolute inset-x-0 top-0 h-1 ${tint.bar}`} />

            <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 leading-tight">
                    {label}
                </span>
                <div
                    className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl ${tint.chip} ${color} transition-transform duration-300 group-hover:scale-110`}
                >
                    <Icon size={16} strokeWidth={2} className="sm:hidden" />
                    <Icon size={20} strokeWidth={2} className="hidden sm:block" />
                </div>
            </div>

            {/* Bagian Angka & Satuan dengan jarak/gap yang rapi */}
            <div className="mt-2 sm:mt-4 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                <span className={`font-display text-xl sm:text-3xl font-extrabold tracking-tight ${color}`}>
                    {angka}
                </span>
                {satuan && (
                    <span className="text-sm sm:text-lg font-bold text-slate-700 tracking-normal">
                        {satuan}
                    </span>
                )}
            </div>

            <div className="mt-1 sm:mt-2 flex items-end justify-between gap-3">
                <div className="text-[11px] sm:text-xs font-medium text-slate-500">{sub}</div>

                {trend && trend.length > 1 && (
                    <div className={`shrink-0 ${color}`}>
                        <MiniSparkline data={trend} />
                    </div>
                )}
            </div>
        </div>
    );
}