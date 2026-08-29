"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
    MessageCircle,
    Mail,
    MapPin,
    Clock,
    ArrowRight,
    Headset,
    Store,
    Sprout,
} from "lucide-react";

const KONTAK = {
    whatsapp: "6282165383828",
    whatsappTampil: "0821-6538-3828",
    // PERUBAHAN: Email sudah diubah menjadi pangankreatif08@gmail.com
    email: "pangankreatif08@gmail.com",
    alamat: "Politeknik Negeri Lhokseumawe, Aceh Utara",
    jam: "Senin–Sabtu, 08.00–17.00 WIB",
};

export function ContactSection() {
    const pesan = encodeURIComponent("Halo PanganKreatif, saya ingin bertanya tentang ");
    const waUrl = `https://wa.me/${KONTAK.whatsapp}?text=${pesan}`;

    // URL Khusus untuk memancing Gmail Web (Compose)
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${KONTAK.email}`;

    return (
        <section id="kontak" className="bg-pola-tani-halus">
            <div className="mx-auto w-full max-w-[1700px] px-6 py-20 sm:px-8 lg:px-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16241B] via-[#1F4D33] to-[#0E7A6B] p-8 text-white sm:p-12 lg:p-14"
                >
                    <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-leaf/10 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-teal/15 blur-2xl" />

                    <div className="relative grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
                        <div>
                            <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
                                Siap menekan biaya
                                <br className="hidden sm:block" />{" "}
                                <span className="text-teal-400">bahan bakumu?</span>
                            </h2>

                            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
                                Gratis mendaftar, tanpa biaya tersembunyi.
                            </p>

                            <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                <Link
                                    href="/register?role=umkm"
                                    className="group rounded-2xl bg-white p-4 text-left transition hover:shadow-lg"
                                >
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                        <Store size={17} />
                                    </span>

                                    <div className="mt-3 font-display text-sm font-bold text-soil">
                                        Saya UMKM Kuliner
                                    </div>
                                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                                        Warung, kafe, katering, rumah makan
                                    </p>

                                    <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                                        Daftar sekarang
                                        <ArrowRight
                                            size={12}
                                            className="transition-transform group-hover:translate-x-0.5"
                                        />
                                    </span>
                                </Link>

                                <Link
                                    href="/register?role=supplier"
                                    className="group rounded-2xl bg-white p-4 text-left transition hover:shadow-lg"
                                >
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-leaf-soft text-leaf-dark">
                                        <Sprout size={17} />
                                    </span>

                                    <div className="mt-3 font-display text-sm font-bold text-soil">
                                        Saya Pemasok
                                    </div>
                                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                                        Kelompok tani, nelayan, distributor
                                    </p>

                                    <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-leaf-dark">
                                        Daftar sekarang
                                        <ArrowRight
                                            size={12}
                                            className="transition-transform group-hover:translate-x-0.5"
                                        />
                                    </span>
                                </Link>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="text-xs font-medium text-white/60">
                                Atau hubungi kami dulu
                            </div>

                            <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="group flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur transition hover:bg-white/15"
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-leaf text-white">
                                    <MessageCircle size={19} />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <div className="font-display text-sm font-bold">WhatsApp</div>
                                    <div className="font-data text-xs text-white/70">
                                        {KONTAK.whatsappTampil}
                                    </div>
                                </div>

                                <ArrowRight
                                    size={16}
                                    className="shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
                                />
                            </a>

                            <a
                                href={gmailUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="group flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur transition hover:bg-white/15"
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal text-white">
                                    <Mail size={19} />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <div className="font-display text-sm font-bold">Email</div>
                                    <div className="truncate text-xs text-white/70">{KONTAK.email}</div>
                                </div>

                                <ArrowRight
                                    size={16}
                                    className="shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
                                />
                            </a>

                            <Link
                                href="/bantuan"
                                className="group flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur transition hover:bg-white/15"
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-harvest text-white">
                                    <Headset size={19} />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <div className="font-display text-sm font-bold">Pusat Bantuan</div>
                                    <div className="text-xs text-white/70">
                                        Pertanyaan yang sering ditanyakan
                                    </div>
                                </div>

                                <ArrowRight
                                    size={16}
                                    className="shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
                                />
                            </Link>

                            <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-white/10 px-4 py-3.5 text-xs text-white/60">
                                <span className="inline-flex items-center gap-2">
                                    <Clock size={13} className="shrink-0" /> {KONTAK.jam}
                                </span>
                                <span className="inline-flex items-start gap-2">
                                    <MapPin size={13} className="mt-0.5 shrink-0" /> {KONTAK.alamat}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}