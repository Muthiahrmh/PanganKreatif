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
            <div className="mx-auto w-full max-w-[1700px] px-5 py-6 sm:px-8 sm:py-14 lg:px-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5 }}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#16241B] via-[#1F4D33] to-[#0B5F7D] p-4 text-white sm:rounded-3xl sm:p-12 lg:p-14"
                >
                    <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-leaf/10 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-teal/15 blur-2xl" />

                    <div className="relative grid gap-4 sm:gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
                        <div>
                            <h2 className="font-display text-lg font-bold leading-tight sm:text-3xl lg:text-4xl">
                                Siap menekan biaya
                                <br className="hidden sm:block" />{" "}
                                <span className="text-teal-400">bahan bakumu?</span>
                            </h2>

                            <p className="mt-2 max-w-md text-[12px] leading-relaxed text-white/80 sm:mt-4 sm:text-base">
                                Gratis mendaftar, tanpa biaya tersembunyi.
                            </p>

                            {/* Dipaksa tetap 2 kolom sebelahan sejak HP terkecil — padding,
                                ikon, dan teks mengecil khusus di mobile biar tetap muat. */}
                            <div className="mt-3.5 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-3">
                                <Link
                                    href="/register?role=umkm"
                                    className="group rounded-xl bg-white p-2.5 text-left transition hover:shadow-lg sm:rounded-2xl sm:p-4"
                                >
                                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-blue-600 sm:h-9 sm:w-9 sm:rounded-lg">
                                        <Store size={10} className="sm:hidden" />
                                        <Store size={17} className="hidden sm:block" />
                                    </span>

                                    <div className="mt-1.5 font-display text-[11px] font-bold leading-tight text-soil sm:mt-3 sm:text-sm">
                                        Saya UMKM Kuliner
                                    </div>
                                    <p className="mt-1 hidden text-xs leading-relaxed text-ink-soft sm:block">
                                        Warung, kafe, katering, rumah makan
                                    </p>

                                    <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 sm:mt-2.5 sm:text-xs">
                                        Daftar sekarang
                                        <ArrowRight
                                            size={11}
                                            className="transition-transform group-hover:translate-x-0.5"
                                        />
                                    </span>
                                </Link>

                                <Link
                                    href="/register?role=supplier"
                                    className="group rounded-xl bg-white p-2.5 text-left transition hover:shadow-lg sm:rounded-2xl sm:p-4"
                                >
                                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-leaf-soft text-leaf-dark sm:h-9 sm:w-9 sm:rounded-lg">
                                        <Sprout size={10} className="sm:hidden" />
                                        <Sprout size={17} className="hidden sm:block" />
                                    </span>

                                    <div className="mt-1.5 font-display text-[11px] font-bold leading-tight text-soil sm:mt-3 sm:text-sm">
                                        Saya Pemasok
                                    </div>
                                    <p className="mt-1 hidden text-xs leading-relaxed text-ink-soft sm:block">
                                        Kelompok tani, nelayan, distributor
                                    </p>

                                    <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-leaf-dark sm:mt-2.5 sm:text-xs">
                                        Daftar sekarang
                                        <ArrowRight
                                            size={11}
                                            className="transition-transform group-hover:translate-x-0.5"
                                        />
                                    </span>
                                </Link>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 sm:gap-3">
                            <div className="text-[11px] font-medium text-white/60 sm:text-xs">
                                Atau hubungi kami dulu
                            </div>

                            <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="group flex items-center gap-2.5 rounded-lg bg-white/10 p-2.5 backdrop-blur transition hover:bg-white/15 sm:gap-4 sm:rounded-2xl sm:p-4"
                            >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-leaf text-white sm:h-11 sm:w-11 sm:rounded-xl">
                                    <MessageCircle size={14} className="sm:hidden" />
                                    <MessageCircle size={19} className="hidden sm:block" />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <div className="font-display text-[13px] font-bold sm:text-sm">WhatsApp</div>
                                    <div className="font-data text-[11px] text-white/70 sm:text-xs">
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
                                className="group flex items-center gap-2.5 rounded-lg bg-white/10 p-2.5 backdrop-blur transition hover:bg-white/15 sm:gap-4 sm:rounded-2xl sm:p-4"
                            >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal text-white sm:h-11 sm:w-11 sm:rounded-xl">
                                    <Mail size={14} className="sm:hidden" />
                                    <Mail size={19} className="hidden sm:block" />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <div className="font-display text-[13px] font-bold sm:text-sm">Email</div>
                                    <div className="truncate text-[11px] text-white/70 sm:text-xs">{KONTAK.email}</div>
                                </div>

                                <ArrowRight
                                    size={16}
                                    className="shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
                                />
                            </a>

                            <Link
                                href="/bantuan"
                                className="group flex items-center gap-2.5 rounded-lg bg-white/10 p-2.5 backdrop-blur transition hover:bg-white/15 sm:gap-4 sm:rounded-2xl sm:p-4"
                            >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal text-white sm:h-11 sm:w-11 sm:rounded-xl">
                                    <Headset size={14} className="sm:hidden" />
                                    <Headset size={19} className="hidden sm:block" />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <div className="font-display text-[13px] font-bold sm:text-sm">Pusat Bantuan</div>
                                    <div className="text-[11px] text-white/70 sm:text-xs">
                                        Pertanyaan yang sering ditanyakan
                                    </div>
                                </div>

                                <ArrowRight
                                    size={16}
                                    className="shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
                                />
                            </Link>

                            <div className="mt-1 flex flex-col gap-1.5 rounded-lg border border-white/10 px-3 py-2.5 text-[10px] text-white/60 sm:mt-2 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-3.5 sm:text-xs">
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