import type { LucideIcon } from "lucide-react";

export function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    color = "text-brand-blue",
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    sub?: string;
    color?: string;
}) {
    return (
        <div className="rounded-xl border border-ink/5 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-soft">{label}</span>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-paper-soft ${color}`}>
                    <Icon size={16} />
                </span>
            </div>
            <div className={`mt-2 font-display text-2xl font-bold ${color}`}>{value}</div>
            {sub && <div className="mt-0.5 text-xs text-ink-soft">{sub}</div>}
        </div>
    );
}
