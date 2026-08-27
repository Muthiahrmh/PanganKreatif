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
    <footer className="border-t border-ink/5 bg-soil text-white">
      <div className="mx-auto w-full max-w-[1700px] px-6 py-14 sm:px-8 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/images/logo-pangankreatif.png"
              alt="PanganKreatif"
              width={200}
              height={70}
              className="h-auto w-36 brightness-0 invert"
            />

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Menghubungkan UMKM kuliner dengan kelompok tani lewat prediksi kebutuhan
              bahan baku dan pembelian kolektif.
            </p>

            <div className="mt-5 flex flex-col gap-2 text-sm text-white/60">
              <span className="inline-flex items-center gap-2">
                <MessageCircle size={14} /> 0821-6538-3828
              </span>
              <span className="inline-flex items-center gap-2">
                <Mail size={14} /> pangankreatif@gmail.com
              </span>
              <span className="inline-flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                Politeknik Negeri Lhokseumawe, Aceh Utara
              </span>
            </div>
          </div>

          {(
            [
              ["Produk", tautan.produk],
              ["Perusahaan", tautan.perusahaan],
              ["Akun", tautan.akun],
            ] as const
          ).map(([judul, daftar]) => (
            <div key={judul}>
              <h3 className="font-display text-sm font-bold">{judul}</h3>

              <div className="mt-4 flex flex-col gap-2.5">
                {daftar.map((t) => (
                  <Link
                    key={t.label}
                    href={t.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
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