import type { OrderStatus } from "@/types/supplier";

const styles: Record<OrderStatus, { label: string; className: string }> = {
    open: {
        label: "Menerima pesanan",
        className: "bg-green-50 text-green-700 ring-green-600/20",
    },
    closed: {
        label: "Ditutup",
        className: "bg-amber-50 text-amber-700 ring-amber-600/20",
    },
    delivered: {
        label: "Terkirim",
        className: "bg-blue-50 text-brand-blue ring-blue-600/20",
    },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
    const s = styles[status];
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.className}`}
        >
            {s.label}
        </span>
    );
}