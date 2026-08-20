export function Footer() {
  return (
    <footer className="mt-auto bg-ink text-paper/70">
      <div className="mx-auto w-full max-w-[1700px] px-8 py-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="font-display text-base font-semibold text-paper">
            PanganKreatif
          </span>
          <p className="mt-1 text-xs">
            Tim Titip Absen — Finalis KMIPN VIII 2026, Politeknik Negeri Lhokseumawe
          </p>
        </div>
        <p className="text-xs">© {new Date().getFullYear()} PanganKreatif. Semua hak dilindungi.</p>
      </div>
    </footer>
  );
}
