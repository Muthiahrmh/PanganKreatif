import type { TxStatus } from "@/types/transaction";

const styles: Record<TxStatus, { label: string; className: string }> = {
    pending: {
        label: "Menunggu",
        className: "bg-amber-50 text-amber-700 ring-amber-600/30",
    },
    success: {
        label: "Lunas",
        className: "bg-emerald-50 text-emerald-700 ring-emerald-600/30",
    },
    failed: {
        label: "Ditolak",
        className: "bg-red-50 text-red-700 ring-red-600/30",
    },
};

export function PaymentBadge({ status }: { status: TxStatus }) {
    const s = styles[status];
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ring-1 ring-inset shadow-sm ${s.className}`}
        >
            {s.label}
        </span>
    );
}