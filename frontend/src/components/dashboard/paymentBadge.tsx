import type { TxStatus } from "@/types/transaction";

const styles: Record<TxStatus, { label: string; className: string }> = {
    pending: {
        label: "Menunggu konfirmasi",
        className: "bg-amber-50 text-amber-700 ring-amber-600/20",
    },
    success: {
        label: "Lunas",
        className: "bg-green-50 text-green-700 ring-green-600/20",
    },
    failed: {
        label: "Ditolak",
        className: "bg-red-50 text-red-700 ring-red-600/20",
    },
};

export function PaymentBadge({ status }: { status: TxStatus }) {
    const s = styles[status];
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.className}`}
        >
            {s.label}
        </span>
    );
}