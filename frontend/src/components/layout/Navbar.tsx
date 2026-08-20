"use client";

import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";

const navItems = [
  { label: "Beranda", href: "#" },
  { label: "Fitur", href: "#fitur" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Manfaat", href: "#manfaat" },
  { label: "Tentang Kami", href: "#tentang" },
  { label: "Kontak", href: "#kontak" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-[1700px] items-center justify-between px-8 py-3.5 lg:px-16">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo-pangankreatif.png"
            alt="PanganKreatif"
            width={150}
            height={45}
            priority
            className="h-auto w-[135px] object-contain"
          />
        </Link>

        {/* Navigation */}
        <div className="hidden items-center gap-7 text-sm font-medium text-ink lg:flex">
          {navItems.map((item, i) => (
            <a
              key={item.label}
              href={item.href}
              className={`relative pb-1 transition-colors hover:text-brand-blue ${
                i === 0
                  ? "border-b-2 border-brand-green font-semibold text-ink"
                  : ""
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-brand-blue hover:text-brand-blue sm:flex"
          >
            <User size={16} />
            Masuk
          </Link>

          <Link
            href="/register"
            className="rounded-full bg-gradient-to-r from-brand-blue to-brand-blue-dark px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-blue/20 transition-transform hover:scale-105"
          >
            Daftar Sekarang
          </Link>
        </div>
      </nav>
    </header>
  );
}