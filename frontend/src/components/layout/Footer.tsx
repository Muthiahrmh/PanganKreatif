import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Mail, MapPin } from "lucide-react";

const tautan = {
  produk: [
    { label: "Fitur", href: "/#fitur" },
    { label: "Cara Kerja", href: "/#cara-kerja" },
    { label: "Manfaat", href: "/#manfaat" },
  ],
  perusahaan: [
    { label: "Tentang Kami", href: "/#tentang" },
    { label: "Kontak", href: "/#kontak" },
    { label: "Pusat Bantuan", href: "/bantuan" },
  ],
  akun: [
    { label: "Masuk", href: "/login" },
    { label: "Daftar sebagai UMKM", href: "/register?role=umkm" },
    { label: "Daftar sebagai Pemasok", href: "/register?role=supplier" },
  ],
};

export function Footer() {
  return (
    <footer className="relative isolate overflow-hidden border-t border-ink/5 bg-soil text-white">
      {/* Garis gradasi tipis di puncak footer — menutup halaman dengan
          gradasi brand yang sama dipakai di tombol utama & logo */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-leaf/60 to-transparent" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-leaf/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-teal/10 blur-3xl" />

      {/* PERBAIKAN MOBILE: Footer sebelumnya belum disentuh sama sekali —
          logo, padding, dan teks masih ukuran desktop penuh di HP. */}
      <div className="relative mx-auto w-full max-w-[1700px] px-5 py-8 sm:px-8 sm:py-14 lg:px-16">
        <div className="grid gap-5 sm:gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/images/logo-pangankreatif.png"
              alt="PanganKreatif"
              width={200}
              height={70}
              className="h-auto w-20 brightness-0 invert sm:w-36"
            />

            <p className="mt-2.5 max-w-xs text-[11.5px] leading-relaxed text-white/60 sm:mt-4 sm:text-sm">
              Menghubungkan UMKM kuliner dengan kelompok tani lewat prediksi kebutuhan
              bahan baku dan pembelian kolektif.
            </p>

            <div className="mt-3 flex flex-col gap-1.5 text-[11.5px] text-white/60 sm:mt-5 sm:gap-2 sm:text-sm">
              <span className="inline-flex items-center gap-2">
                <MessageCircle size={12} className="shrink-0 sm:hidden" />
                <MessageCircle size={14} className="hidden shrink-0 sm:block" /> 0821-6538-3828
              </span>
              <span className="inline-flex items-center gap-2">
                <Mail size={12} className="shrink-0 sm:hidden" />
                <Mail size={14} className="hidden shrink-0 sm:block" /> pangankreatif08@gmail.com
              </span>
              <span className="inline-flex items-start gap-2">
                <MapPin size={12} className="mt-0.5 shrink-0 sm:hidden" />
                <MapPin size={14} className="mt-0.5 hidden shrink-0 sm:block" />
                Politeknik Negeri Lhokseumawe, Aceh Utara
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:contents sm:gap-0">
            {(
              [
                ["Produk", tautan.produk],
                ["Perusahaan", tautan.perusahaan],
                ["Akun", tautan.akun],
              ] as const
            ).map(([judul, daftar]) => (
              <div key={judul}>
                <h3 className="font-display text-[11.5px] font-bold sm:text-sm">{judul}</h3>

                <div className="mt-2 flex flex-col gap-1.5 sm:mt-4 sm:gap-2.5">
                  {daftar.map((t) => (
                    <Link
                      key={t.label}
                      href={t.href}
                      className="text-[11px] text-white/60 transition-colors hover:text-white sm:text-sm"
                    >
                      {t.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-1.5 border-t border-white/10 pt-4 text-[10px] text-white/45 sm:mt-12 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:pt-6 sm:text-xs">
          <span>
            © {new Date().getFullYear()} PanganKreatif — Tim Titip Absen, Politeknik
            Negeri Lhokseumawe
          </span>
          <span>Data cuaca: BMKG · Pembayaran: Midtrans</span>
        </div>
      </div>
    </footer>
  );
}