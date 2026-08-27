import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Tombol kembali.
 *
 * Dijadikan satu komponen supaya bentuknya seragam di semua halaman
 * luar dashboard — kalau disalin di tiap berkas, perubahan berikutnya
 * gampang terlewat di salah satunya.
 *
 * Bentuknya kapsul, bukan teks polos, karena di halaman yang padat
 * isian tautan telanjang mudah terlewat dan tidak terlihat bisa
 * diklik.
 */
export function TombolKembali({
    href = "/",
    label = "Kembali ke beranda",
    labelPendek,
    className = "",
}: {
    href?: string;
    label?: string;
    /** Dipakai di layar sempit kalau labelnya panjang */
    labelPendek?: string;
    className?: string;
}) {
    return (
        <Link
            href={href}
            className={`group inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white py-2 pl-3 pr-4 text-sm font-medium text-ink-soft shadow-sm transition-all hover:border-ink/20 hover:text-ink hover:shadow ${className}`}
        >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cream transition-transform group-hover:-translate-x-0.5">
                <ArrowLeft size={13} />
            </span>

            {labelPendek ? (
                <>
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{labelPendek}</span>
                </>
            ) : (
                label
            )}
        </Link>
    );
}