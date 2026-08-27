import { LucideIcon } from "lucide-react";

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string; // contoh: "50,32 kg" atau "240 catatan"
    sub: string;
    color?: string;
}

export function StatCard({ icon: Icon, label, value, sub, color = "text-blue-600" }: StatCardProps) {
    // Memisahkan angka dengan teks satuannya secara otomatis
    const parts = value.split(" ");
    const angka = parts[0] || "";
    const satuan = parts.slice(1).join(" ") || "";

    return (
        <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {label}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                    <Icon size={20} strokeWidth={2} />
                </div>
            </div>

            {/* Bagian Angka & Satuan dengan jarak/gap yang rapi */}
            <div className="mt-4 flex items-baseline gap-2 flex-wrap">
                <span className={`font-display text-3xl font-extrabold tracking-tight ${color}`}>
                    {angka}
                </span>
                {satuan && (
                    <span className="text-lg font-bold text-slate-700 tracking-normal">
                        {satuan}
                    </span>
                )}
            </div>

            <div className="mt-2 text-xs font-medium text-slate-500">
                {sub}
            </div>
        </div>
    );
}