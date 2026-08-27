import type { OrderStatus } from "@/types/supplier";

const styles: Record<OrderStatus, { label: string; className: string }> = {
    open: {
        label: "Menerima Pesanan",
        className: "bg-emerald-50 text-emerald-700 ring-emerald-600/30",
    },
    closed: {
        label: "Ditutup",
        className: "bg-amber-50 text-amber-700 ring-amber-600/30",
    },
    delivered: {
        label: "Terkirim",
        className: "bg-blue-50 text-blue-700 ring-blue-600/30",
    },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
    const s = styles[status];
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ring-1 ring-inset shadow-sm ${s.className}`}
        >
            {s.label}
        </span>
    );
}