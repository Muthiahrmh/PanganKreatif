"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { User, Menu, X, ArrowRight, Download } from "lucide-react";

// Menu teks biasa (tanpa "Aplikasi" karena sudah jadi tombol khusus)
const navItems = [
  { label: "Beranda", href: "#beranda" },
  { label: "Fitur", href: "#fitur" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Peran", href: "#peran" },
  { label: "Manfaat", href: "#manfaat" },
  { label: "Tentang", href: "#tentang" },
  { label: "Kontak", href: "#kontak" },
];

export function Navbar() {
  const [aktif, setAktif] = useState("#beranda");
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [digulir, setDigulir] = useState(false);

  useEffect(() => {
    function pantau() {
      setDigulir(window.scrollY > 24);
      if (window.scrollY < 120) setAktif("#beranda");
    }

    pantau();
    window.addEventListener("scroll", pantau, { passive: true });
    return () => window.removeEventListener("scroll", pantau);
  }, []);

  useEffect(() => {
    const bagian = navItems
      .map((i) => document.querySelector(i.href))
      .filter((el): el is Element => el !== null);

    if (bagian.length === 0) return;

    const pengamat = new IntersectionObserver(
      (entri) => {
        const terlihat = entri
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (terlihat?.target.id) setAktif(`#${terlihat.target.id}`);
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    bagian.forEach((b) => pengamat.observe(b));
    return () => pengamat.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuTerbuka ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuTerbuka]);

  function klikTautan(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    setMenuTerbuka(false);
    if (href !== "#beranda") return;

    e.preventDefault();
    setAktif("#beranda");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${digulir
          ? "border-b border-leaf/10 bg-white/85 py-1 shadow-sm shadow-soil/5 backdrop-blur-md"
          : "border-b border-transparent bg-transparent py-2.5"
        }`}
    >
      <nav className="mx-auto flex max-w-[1700px] items-center justify-between px-6 py-2.5 sm:px-8 lg:px-16">
        <Link href="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <Image
            src="/images/logo-pangankreatif.png"
            alt="PanganKreatif"
            width={140}
            height={40}
            priority
            className={`h-auto object-contain transition-all duration-300 ${digulir ? "w-[110px]" : "w-[130px]"
              }`}
          />
        </Link>

        {/* Menu Teks Utama (Lebih longgar karena menu Aplikasi dipisah) */}
        <div className="hidden items-center lg:flex">
          {navItems.map((item) => {
            const ini = aktif === item.href;

            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => klikTautan(e, item.href)}
                className={`relative rounded-full px-3 py-2 text-sm font-medium transition-colors xl:px-4 ${ini ? "text-leaf-dark" : "text-ink-soft hover:text-ink"
                  }`}
              >
                {ini && (
                  <motion.span
                    layoutId="penanda-nav"
                    className="absolute inset-0 rounded-full bg-leaf-soft"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </a>
            );
          })}
        </div>

        {/* Tombol Aksi di Kanan: Pasang App, Masuk, Daftar */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Tombol Khusus Aplikasi / Pasang PWA */}
          <a
            href="#pasang"
            className="hidden items-center gap-1.5 rounded-full border border-leaf/30 bg-leaf-soft/50 px-4 py-2 text-sm font-semibold text-leaf-dark transition-all hover:bg-leaf-soft hover:shadow-sm md:flex"
            title="Pasang Aplikasi ke HP"
          >
            <Download size={15} />
            <span>Pasang App</span>
          </a>

          <Link
            href="/login"
            className="hidden items-center gap-2 rounded-full border border-ink/12 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-teal hover:text-teal-dark sm:flex"
          >
            <User size={16} />
            Masuk
          </Link>

          <Link
            href="/register"
            className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-leaf to-teal px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-leaf/20 transition-all hover:shadow-lg hover:shadow-leaf/25 sm:px-5 sm:text-sm"
          >
            Daftar Sekarang
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>

          {/* Tombol menu HP */}
          <button
            onClick={() => setMenuTerbuka((v) => !v)}
            aria-label={menuTerbuka ? "Tutup menu" : "Buka menu"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink transition hover:bg-leaf-soft lg:hidden"
          >
            {menuTerbuka ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Laci menu HP (Termasuk tombol Pasang App di dalamnya) */}
      <AnimatePresence>
        {menuTerbuka && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-leaf/10 bg-white lg:hidden"
          >
            <div className="flex flex-col px-6 pb-5 pt-2 sm:px-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => klikTautan(e, item.href)}
                  className={`rounded-lg px-3 py-3 text-sm transition-colors ${aktif === item.href
                      ? "bg-leaf-soft font-semibold text-leaf-dark"
                      : "text-ink-soft hover:bg-cream hover:text-ink"
                    }`}
                >
                  {item.label}
                </a>
              ))}

              {/* Tambahan menu Pasang App khusus versi HP di dalam laci */}
              <a
                href="#pasang"
                onClick={() => setMenuTerbuka(false)}
                className="mt-1 flex items-center gap-2 rounded-lg bg-leaf-soft px-3 py-3 text-sm font-semibold text-leaf-dark transition-colors"
              >
                <Download size={16} />
                Pasang Aplikasi ke HP
              </a>

              <Link
                href="/login"
                onClick={() => setMenuTerbuka(false)}
                className="mt-3 flex items-center justify-center gap-2 rounded-full border border-ink/12 px-4 py-2.5 text-sm font-medium text-ink sm:hidden"
              >
                <User size={16} />
                Masuk
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}