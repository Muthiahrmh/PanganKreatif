import Image from "next/image";
import Link from "next/link";

export function AuthLayout({
    children,
    title,
    subtitle,
    backgroundImage = "/images/walpaper_regis_umkm.png",
}: {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    backgroundImage?: string;
}) {
    return (
        <div className="flex min-h-screen">
            <div className="relative hidden w-1/2 flex-col overflow-hidden bg-gradient-to-br from-[#40578f] via-[#3564bb] to-[#159b87] text-white lg:flex">
                <div className="absolute inset-0 bg-white/[0.03]" />
                <div className="relative z-10 px-10 pt-10">
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

                <div className="relative z-10 mt-24 px-10 text-right">
                    <h2 className="ml-auto max-w-md font-display text-4xl font-bold leading-tight">
                        Prediksi lebih cerdas,
                        <br />
                        rantai pasok lebih kuat.
                    </h2>
                    <p className="ml-auto mt-5 max-w-md text-base leading-relaxed text-white/85">
                        Satu platform yang menghubungkan UMKM kuliner
                        dengan kelompok tani lewat AI Demand Forecasting
                        dan Collective Procurement.
                    </p>
                </div>

                <div className="flex-1" />
                <p className="relative z-10 px-10 pb-6 text-right text-xs text-white/60">
                    © {new Date().getFullYear()} PanganKreatif — Tim Titip Absen
                </p>
                <div className="pointer-events-none absolute -bottom-20 -left-0 z-[1]">
                    <div className="relative h-[54rem] w-[50rem] max-w-none">
                        <Image
                            key={backgroundImage}
                            src={backgroundImage}
                            alt=""
                            fill
                            priority
                            className="object-contain object-left-bottom"
                        />
                    </div>
                </div>
            </div>

            <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
                <div className="mx-auto w-full max-w-sm">
                    <Link href="/" className="mb-8 flex lg:hidden">
                        <Image
                            src="/images/logo-pangankreatif.png"
                            alt="PanganKreatif"
                            width={180}
                            height={60}
                            className="h-auto w-36"
                        />
                    </Link>
                    <h1 className="font-display text-2xl font-bold text-ink">
                        {title}
                    </h1>
                    <p className="mt-1.5 text-sm text-ink-soft">
                        {subtitle}
                    </p>
                    <div className="mt-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}