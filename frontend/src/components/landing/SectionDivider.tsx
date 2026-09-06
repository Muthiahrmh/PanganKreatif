/**
 * Pemisah antarbagian berbentuk lengkung.
 *
 * Batas lurus terasa kaku untuk produk pertanian. Lengkung organik
 * lazim dipakai supaya perpindahan antarbagian terasa mengalir.
 *
 * @param dari warna bagian di atasnya
 * @param ke   warna bagian di bawahnya
 */
export function SectionDivider({
    dari = "#FBF9F3",
    ke = "#FFFFFF",
    balik = false,
}: {
    dari?: string;
    ke?: string;
    balik?: boolean;
}) {
    return (
        <div className="relative -mb-px" style={{ backgroundColor: dari }} aria-hidden>
            <svg
                viewBox="0 0 1440 64"
                preserveAspectRatio="none"
                className="block h-6 w-full sm:h-10"
                style={{ transform: balik ? "scaleX(-1)" : undefined }}
            >
                <path
                    d="M0,32 C240,64 480,0 720,24 C960,48 1200,8 1440,32 L1440,64 L0,64 Z"
                    fill={ke}
                />
            </svg>
        </div>
    );
}