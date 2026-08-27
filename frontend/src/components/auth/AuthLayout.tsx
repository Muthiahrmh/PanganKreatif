"use client";

import Image from "next/image";
import Link from "next/link";
import { TombolKembali } from "@/components/ui/TombolKembali";

const tema = {
    umkm: {
        gradasi: "from-[#0B1220] via-[#1E3A8A] to-[#2563EB]",
        aksen: "text-blue-300",
    },
    tani: {
        gradasi: "from-[#16241B] via-[#1F4D33] to-[#5CA935]",
        aksen: "text-leaf",
    },
} as const;

export function AuthLayout({
    children,
    title,
    subtitle,
    backgroundImage = "/images/walpaper_regis_umkm.png",
    peran = "umkm",
    mode = "ilustrasi",
}: {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    backgroundImage?: string;
    peran?: keyof typeof tema;
    mode?: "ilustrasi" | "penuh";
}) {
    const t = tema[peran];
    const penuh = mode === "penuh";

    return (
        <div className="flex min-h-screen">
            {/* Panel kiri */}
            <div
                className={`relative hidden w-1/2 flex-col overflow-hidden bg-gradient-to-br text-white lg:flex ${penuh ? "from-[#1565C0] via-[#159B87] to-[#3FA24B]" : t.gradasi
                    }`}
            >
                {penuh ? (
                    <Image
                        key={backgroundImage}
                        src={backgroundImage}
                        alt=""
                        fill
                        priority
                        sizes="50vw"
                        className="object-contain object-center"
                    />
                ) : (
                    <>
                        <div className="relative z-20 shrink-0 px-10 pt-10">
                            <Link href="/" className="inline-block">
                                <Image
                                    src="/images/logo-pangankreatif.png"
                                    alt="PanganKreatif"
                                    width={220}
                                    height={80}
                                    className="h-auto w-40 object-contain"
                                    priority
                                />
                            </Link>
                        </div>

                        <div className="relative z-20 flex flex-1 items-start justify-end px-10 pt-24 xl:pt-28">
                            <div className="max-w-md text-right">
                                <h2 className="font-display text-4xl font-bold leading-tight drop-shadow-md">
                                    Prediksi lebih cerdas,
                                    <br />
                                    <span className={t.aksen}>
                                        rantai pasok lebih kuat.
                                    </span>
                                </h2>

                                <p className="mt-5 text-base leading-relaxed text-white/90 drop-shadow">
                                    Satu platform yang menghubungkan UMKM kuliner dengan
                                    kelompok tani lewat AI Demand Forecasting dan
                                    Collective Procurement.
                                </p>
                            </div>
                        </div>

                        <p className="absolute bottom-6 right-10 z-20 text-right text-xs text-white/70">
                            © {new Date().getFullYear()} PanganKreatif — Tim Titip Absen
                        </p>

                        {/* KUNCI PERUBAHAN ADA DI SINI: Ukuran gambar dibedakan berdasarkan peran */}
                        <div
                            className={`pointer-events-none absolute bottom-0 left-0 right-0 z-[1] ${peran === "umkm"
                                    // UMKM: Diberikan scale untuk memperbesar gambar agar tidak kekecilan
                                    ? "top-[15%] scale-[1.2] xl:scale-[1.3] origin-bottom-left"
                                    // Tani: Batas atas diturunkan ke 45% agar gambar tidak tinggi menabrak teks
                                    : "top-[45%] xl:top-[40%]"
                                }`}
                        >
                            <Image
                                key={backgroundImage}
                                src={backgroundImage}
                                alt=""
                                fill
                                priority
                                sizes="(min-width: 1280px) 50vw, 50vw"
                                className="object-contain object-left-bottom"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Panel kanan */}
            <div className="flex w-full flex-col justify-center bg-white px-6 py-8 sm:px-12 lg:w-1/2 lg:px-16 xl:px-20">
                <div className="mx-auto w-full max-w-lg">
                    <TombolKembali className="mb-5" />

                    <Link href="/" className="mb-6 flex lg:hidden">
                        <Image
                            src="/images/logo-pangankreatif.png"
                            alt="PanganKreatif"
                            width={180}
                            height={60}
                            className="h-auto w-36"
                        />
                    </Link>

                    <h1 className="font-display text-2xl font-bold text-soil sm:text-3xl">
                        {title}
                    </h1>

                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{subtitle}</p>

                    <div className="mt-6">{children}</div>
                </div>
            </div>
        </div>
    );
}