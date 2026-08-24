import { Mail, Phone, MapPin } from "lucide-react";

const kontak = [
    {
        icon: Mail,
        label: "Email",
        value: "pangankreatif08@gmail.com",
        href: "mailto:pangankreatif08@gmail.com",
    },
    {
        icon: Phone,
        label: "No. Telepon",
        value: "0821-6538-3828",
        href: "tel:+6282165383828",
    },
    {
        icon: MapPin,
        label: "Alamat",
        value: "Buketrata, Kecamatan Blang Mangat, Kota Lhokseumawe, Provinsi Aceh",
        href: null,
    },
];

export function ContactSection() {
    return (
        <section id="kontak" className="bg-paper-soft py-20">
            <div className="mx-auto max-w-[1000px] px-8 lg:px-16">
                <div className="mb-10 text-center">
                    <span className="text-sm font-semibold uppercase tracking-wide text-brand-blue">
                        Kontak
                    </span>
                    <h2 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
                        Hubungi Kami
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-[15px] text-ink-soft">
                        Ada pertanyaan atau ingin bekerja sama dengan PanganKreatif?
                        Kami siap membantu.
                    </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                    {kontak.map((item) => {
                        const Icon = item.icon;
                        const isi = (
                            <>
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                                    <Icon size={18} />
                                </div>
                                <div className="mt-3 text-sm font-semibold text-ink">
                                    {item.label}
                                </div>
                                <div className="mt-1 text-sm leading-relaxed text-ink-soft">
                                    {item.value}
                                </div>
                            </>
                        );

                        return item.href ? (
                            <a
                            key = { item.label }
                                href = { item.href }
                                className = "rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                            >
                            { isi }
                            </a>
                ) : (
                <div key={item.label} className="rounded-2xl bg-white p-6 shadow-sm">
                    {isi}
                </div>
                );
                })}
            </div>
        </div>
    </section >
    );
}