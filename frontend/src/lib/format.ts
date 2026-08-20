export function toNumber(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

export function formatRupiah(value: unknown): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(toNumber(value));
}

export function formatRupiahShort(value: unknown): string {
    const n = toNumber(value);
    if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
    if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1).replace(".", ",")} Jt`;
    if (n >= 1_000) return `Rp${(n / 1_000).toFixed(0)} rb`;
    return formatRupiah(n);
}

export function formatNumber(value: unknown, maxDecimals = 1): string {
    return new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: maxDecimals,
    }).format(toNumber(value));
}

export function formatDate(value: string | Date): string {
    return new Date(value).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function toDateInput(value: string | Date): string {
    const d = new Date(value);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function relativeDeadline(deadline: string | Date): string {
    const target = new Date(deadline);
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diffDays = Math.round((startOfDay(target) - startOfDay(now)) / 86_400_000);

    if (diffDays === 0) return "Tutup hari ini";
    if (diffDays === 1) return "Tutup besok";
    if (diffDays > 1) return `${diffDays} hari lagi`;
    if (diffDays === -1) return "Lewat 1 hari";
    return `Lewat ${Math.abs(diffDays)} hari`;
}