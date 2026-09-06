"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  Menu,
  X,
  ArrowRight,
  Download,
  Smartphone,
  Home,
  LayoutGrid,
  Workflow,
  Users,
  Star,
  Scale,
  BarChart3,
  Info,
  Mail,
} from "lucide-react";

// Menu teks biasa (tanpa "Aplikasi" karena sudah jadi tombol khusus)
// PERBAIKAN: tiap item dikasih ikon supaya laci menu HP nggak kelihatan
// polos/kosong — sebelumnya cuma teks polos melayang dengan banyak
// ruang kosong, jadi kelihatan belum jadi/asal-asalan.
const navItems = [
  { label: "Beranda", href: "#beranda", icon: Home },
  { label: "Fitur", href: "#fitur", icon: LayoutGrid },
  { label: "Cara Kerja", href: "#cara-kerja", icon: Workflow },
  { label: "Peran", href: "#peran", icon: Users },
  { label: "Manfaat", href: "#manfaat", icon: Star },
  { label: "Perbandingan", href: "#perbandingan", icon: Scale },
  { label: "Statistik", href: "#statistik", icon: BarChart3 },
  { label: "Tentang", href: "#tentang", icon: Info },
  { label: "Kontak", href: "#kontak", icon: Mail },
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
    e.preventDefault();
    setMenuTerbuka(false);
    setAktif(href);

    // PERBAIKAN #1: sebelumnya tautan di laci menu HP mengandalkan lompatan
    // anchor bawaan browser (tanpa preventDefault). Masalahnya, saat laci
    // terbuka, document.body.style.overflow dikunci ke "hidden" lewat
    // useEffect — dan useEffect baru benar-benar melepas kuncian itu
    // SETELAH event klik ini selesai diproses. Jadi tepat di momen
    // browser mencoba lompat ke #fitur dkk, halaman masih terkunci
    // overflow:hidden sehingga lompatannya gagal total tanpa error apa
    // pun (persis gejala "tombol nggak berfungsi"). Sekarang kuncian
    // dilepas duluan secara langsung.
    document.body.style.overflow = "";

    // PERBAIKAN #2: scroll-nya SEMPAT jalan tapi hasilnya kelewatan jauh
    // (lompat sampai section berikutnya). Penyebabnya: laci menu masih
    // dalam proses animasi menutup (250ms, lihat transition di motion.div
    // di bawah) tepat saat scrollIntoView dihitung — begitu lacinya
    // benar-benar collapse ke tinggi 0 sesaat kemudian, seluruh konten di
    // bawahnya ikut naik, jadi posisi scroll yang tadinya pas jadi
    // kelewatan. Makanya ditunda dulu sampai animasi menutup laci selesai
    // (300ms, sedikit lebih lama dari durasi animasinya) baru discroll,
    // supaya tata letak halaman sudah stabil duluan.
    setTimeout(() => {
      if (href === "#beranda") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      history.pushState(null, "", href);
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${digulir
          ? "border-b border-leaf/10 bg-white/85 py-1 shadow-sm shadow-soil/5 backdrop-blur-md"
          : "border-b border-transparent bg-transparent py-2.5"
        }`}
    >
      <nav className="mx-auto flex max-w-[1700px] items-center justify-between px-6 py-2.5 sm:px-8 lg:px-8 xl:px-16">
        <Link href="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <Image
            src="/images/logo-pangankreatif.png"
            alt="PanganKreatif"
            width={140}
            height={40}
            priority
            className={`h-auto object-contain transition-all duration-300 ${digulir ? "w-[72px] sm:w-[95px] xl:w-[110px]" : "w-[80px] sm:w-[105px] xl:w-[130px]"
              }`}
          />
        </Link>

        {/* Menu Teks Utama — tetap muncul dari breakpoint lg (laptop),
            tapi sejak "Perbandingan" & "Statistik" ditambahkan (9 menu
            sekaligus) paddingnya dibikin lebih rapat & fontnya lebih
            kecil khusus di lg, baru longgar lagi mulai xl. Supaya laptop
            tetap dapat menu penuh, bukan menu hamburger. */}
        <div className="hidden items-center lg:flex">
          {navItems.map((item) => {
            const ini = aktif === item.href;

            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => klikTautan(e, item.href)}
                className={`relative rounded-full px-1.5 py-2 text-xs font-medium whitespace-nowrap transition-colors xl:px-3 xl:text-sm ${ini ? "text-leaf-dark" : "text-ink-soft hover:text-ink"
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

          {/* Tombol Khusus Aplikasi — sebelumnya diciutkan jadi ikon polos
              doang di rentang lg (laptop pas-pasan lebarnya) dan malah jadi
              gak jelas unduh apa. Sekarang tetap ada teks pendek "App" +
              ikon HP (bukan ikon unduh generik) supaya tetap jelas ini
              tombol pasang aplikasi Android, teks lengkap balik dari xl. */}
          <a
            href="#pasang"
            className="hidden items-center gap-1.5 rounded-full border border-leaf/30 bg-leaf-soft/50 px-3 py-2 text-xs font-semibold text-leaf-dark transition-all hover:bg-leaf-soft hover:shadow-sm lg:flex xl:gap-2 xl:px-4 xl:py-2 xl:text-sm"
            title="Pasang Aplikasi Android PanganKreatif"
          >
            <Smartphone size={15} />
            <span className="xl:hidden">App</span>
            <span className="hidden xl:inline">Pasang App</span>
          </a>

          <Link
            href="/login"
            className="hidden items-center gap-1.5 rounded-full border border-ink/12 px-3 py-2 text-xs font-medium text-ink transition-colors hover:border-teal hover:text-teal-dark sm:flex xl:gap-2 xl:px-4 xl:text-sm"
          >
            <User size={15} />
            Masuk
          </Link>

          <Link
            href="/register"
            className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-leaf to-teal px-3.5 py-2.5 text-xs font-semibold text-white shadow-md shadow-leaf/20 transition-all hover:shadow-lg hover:shadow-leaf/25 xl:px-5 xl:text-sm"
          >
            Daftar Sekarang
            <ArrowRight
              size={15}
              className="hidden transition-transform group-hover:translate-x-0.5 xl:inline-block"
            />
          </Link>

          {/* Tombol menu HP */}
          <button
            onClick={() => setMenuTerbuka((v) => !v)}
            aria-label={menuTerbuka ? "Tutup menu" : "Buka menu"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink transition hover:bg-leaf-soft lg:hidden"
          >
            {menuTerbuka ? <X size={18} /> : <Menu size={18} />}
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
            <div className="flex flex-col gap-0.5 px-4 pb-4 pt-2 sm:px-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const ini = aktif === item.href;

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => klikTautan(e, item.href)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${ini
                        ? "bg-leaf-soft font-semibold text-leaf-dark"
                        : "text-ink-soft hover:bg-cream hover:text-ink"
                      }`}
                  >
                    <Icon size={16} className={ini ? "text-leaf-dark" : "text-ink-soft/60"} />
                    {item.label}
                  </a>
                );
              })}

              {/* Tambahan menu Pasang App khusus versi HP di dalam laci */}
              <a
                href="#pasang"
                onClick={() => setMenuTerbuka(false)}
                className="mt-2 flex items-center gap-3 rounded-xl bg-leaf-soft px-3 py-2.5 text-sm font-semibold text-leaf-dark transition-colors"
              >
                <Download size={16} />
                Pasang Aplikasi ke HP
              </a>

              <Link
                href="/login"
                onClick={() => setMenuTerbuka(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-full border border-ink/12 px-4 py-2.5 text-sm font-medium text-ink sm:hidden"
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