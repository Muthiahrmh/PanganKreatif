"use client";

/**
 * Deretan komoditas yang bergerak perlahan.
 *
 * Isinya komoditas yang benar-benar ada di katalog platform, dari
 * pemasok di Aceh. Bagian ini memberi kesan cakupan tanpa perlu
 * mengklaim angka yang belum tercapai.
 */
const komoditas = [
    "Cabai Merah Keriting",
    "Bawang Merah",
    "Asam Sunti",
    "Daun Temurui",
    "Kopi Arabika Gayo",
    "Ikan Tongkol",
    "Kelapa Parut",
    "Beras Lokal",
    "Kayu Manis",
    "Udang",
    "Kentang Gayo",
    "Minyak Goreng",
    "Ikan Kayu",
    "Bawang Putih",
];

export function KomoditasStrip() {
    // Digandakan supaya perputarannya tidak terlihat menyambung
    const daftar = [...komoditas, ...komoditas];

    return (
        <div className="overflow-hidden border-y border-leaf/10 bg-leaf-soft py-3">
            <div className="strip-jalan flex w-max gap-8">
                {daftar.map((k, i) => (
                    <span
                        key={`${k}-${i}`}
                        className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-leaf-dark"
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
                        {k}
                    </span>
                ))}
            </div>

            <style jsx>{`
                /* Class polos (bukan animate-[...] arbitrary Tailwind) supaya
                   "infinite"-nya pasti kebaca browser, tidak tergantung
                   parsing bracket Tailwind v4 yang kadang meleset. */
                .strip-jalan {
                    animation: jalan 38s linear infinite;
                    will-change: transform;
                }

                @keyframes jalan {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-50%);
                    }
                }

                /* Hormati pengguna yang mematikan animasi */
                @media (prefers-reduced-motion: reduce) {
                    .strip-jalan {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}