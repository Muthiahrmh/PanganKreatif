"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Wallet, AlertTriangle, Check, Copy, Landmark, Upload, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatDate, formatRupiah } from "@/lib/format";
import { StatCard } from "@/components/dashboard/StatCard";
import { TombolLihatBukti } from "@/components/dashboard/TombolLihatBukti";

interface Rekening {
    bank: string;
    nomor: string | null;
    atasNama: string | null;
}

interface DompetDigital {
    nomor: string;
    atasNama: string | null;
    providers: string[];
}

const LABEL_EWALLET: Record<string, string> = {
    dana: "DANA",
    gopay: "GoPay",
    shopeepay: "ShopeePay",
    ovo: "OVO",
};

interface BarisPemasok {
    supplierId: string;
    groupName: string;
    city: string;
    rekening: Rekening | null;
    dompetDigital: DompetDigital | null;
    jumlahTransaksi: number;
    totalNilai: number;
    totalKomisi: number;
    totalDiteruskan: number;
    transaksiTerakhir: string | null;
    buktiTransaksiId?: string | null;
    catatan?: string | null;
}

interface DataPayout {
    status: "pending" | "paid";
    ringkasan: {
        jumlahPemasok: number;
        jumlahTransaksi: number;
        totalNilai: number;
        totalKomisi: number;
        totalDiteruskan: number;
        tanpaRekening: number;
    };
    pemasok: BarisPemasok[];
}

const ITEMS_PER_PAGE = 5;

export default function PayoutsPage() {
    const user = useAuthStore((s) => s.user);

    const [tab, setTab] = useState<"pending" | "paid">("pending");
    const [data, setData] = useState<DataPayout | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tersalin, setTersalin] = useState<string | null>(null);
    const [sasaran, setSasaran] = useState<BarisPemasok | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const load = useCallback(async () => {
        try {
            const res = await api.get<DataPayout>("/admin/payouts", { params: { status: tab } });
            setData(res.data);
            setError(null);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [tab]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    async function salin(teks: string, id: string) {
        try {
            await navigator.clipboard.writeText(teks);
            setTersalin(id);
            window.setTimeout(() => setTersalin(null), 2000);
        } catch {
            setError("Nomor rekening gagal disalin.");
        }
    }

    if (user && user.role !== "admin") {
        return <p className="text-sm font-medium text-slate-500 p-6">Halaman ini khusus untuk akun administrator platform.</p>;
    }

    const r = data?.ringkasan;
    const pemasokList = data?.pemasok ?? [];

    // Kalkulasi Pagination
    const totalPages = Math.ceil(pemasokList.length / ITEMS_PER_PAGE);
    const paginatedPemasok = pemasokList.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="flex flex-col gap-6 md:gap-8 pb-10">
            {/* Header Halaman */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 mb-2 border border-blue-100">
                    Manajemen Keuangan & Kliring
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Penerusan Dana (Payouts)
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
                    Pembayaran UMKM ditampung di rekening platform. Komisi platform dipotong otomatis, dan sisanya diteruskan ke rekening pemasok/tani.
                </p>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700 shadow-sm">
                    {error}
                </div>
            )}

            {/* Kotak Statistik Utama */}
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    icon={Wallet}
                    label={tab === "pending" ? "Perlu Diteruskan" : "Sudah Diteruskan"}
                    value={loading ? "..." : formatRupiah(r?.totalDiteruskan ?? 0)}
                    sub={`${r?.jumlahPemasok ?? 0} pemasok · ${r?.jumlahTransaksi ?? 0} transaksi`}
                    color={tab === "pending" ? "text-amber-500" : "text-emerald-600"}
                />
                <StatCard
                    icon={Landmark}
                    label="Total Nilai Transaksi"
                    value={loading ? "..." : formatRupiah(r?.totalNilai ?? 0)}
                    sub="Dibayar lunas oleh UMKM"
                />
                <StatCard
                    icon={Check}
                    label="Komisi Platform"
                    value={loading ? "..." : formatRupiah(r?.totalKomisi ?? 0)}
                    sub="Pendapatan PanganKreatif"
                    color="text-emerald-600"
                />
            </div>

            {tab === "pending" && (r?.tanpaRekening ?? 0) > 0 && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900 shadow-sm">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                    <span>
                        Terdapat <strong className="text-amber-950">{r?.tanpaRekening} pemasok</strong> belum mencantumkan informasi rekening bank. Dana mereka tertahan sampai mereka melengkapi profil akun.
                    </span>
                </div>
            )}

            {/* Tab Navigasi Pending / Paid */}
            <div className="flex gap-2 rounded-2xl bg-slate-200/70 p-1.5 shadow-inner">
                {(["pending", "paid"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => {
                            setTab(t);
                            setLoading(true);
                            setCurrentPage(1);
                        }}
                        className={`flex-1 rounded-xl px-5 py-2 text-xs font-bold transition-all ${tab === t
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        {t === "pending" ? "Perlu Diteruskan" : "Sudah Diteruskan"}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-32 animate-pulse rounded-3xl bg-slate-100" />
                    ))}
                </div>
            ) : pemasokList.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
                        <Wallet size={28} />
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-800">
                        {tab === "pending" ? "Tidak ada dana tertunda saat ini" : "Belum ada riwayat dana yang diteruskan"}
                    </h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 leading-relaxed">
                        {tab === "pending"
                            ? "Semua kewajiban pencairan dana ke pemasok telah diselesaikan dengan baik."
                            : "Catatan transfer yang sudah ditandai selesai akan muncul di sini."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {paginatedPemasok.map((p) => (
                        <div
                            key={p.supplierId}
                            className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all hover:border-slate-300"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h3 className="font-display text-lg font-extrabold text-slate-900">
                                        {p.groupName}
                                    </h3>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        {p.city} · <strong className="text-slate-700">{p.jumlahTransaksi} transaksi</strong>
                                        {p.transaksiTerakhir &&
                                            ` · Transaksi terakhir ${formatDate(p.transaksiTerakhir)}`}
                                    </p>
                                </div>

                                <div className="text-right shrink-0">
                                    <div className="font-display text-2xl font-extrabold text-emerald-600">
                                        {formatRupiah(p.totalDiteruskan)}
                                    </div>
                                    <div className="text-xs font-medium text-slate-400 mt-0.5">
                                        Dari total {formatRupiah(p.totalNilai)} · Komisi {formatRupiah(p.totalKomisi)}
                                    </div>
                                </div>
                            </div>

                            {p.rekening && (
                                <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-sm">
                                    <span className="font-bold text-slate-900">{p.rekening.bank}</span>
                                    <span className="font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">{p.rekening.nomor}</span>
                                    <button
                                        onClick={() =>
                                            salin(p.rekening?.nomor ?? "", p.supplierId)
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-blue-600 shadow-sm transition hover:bg-slate-50"
                                    >
                                        {tersalin === p.supplierId ? (
                                            <Check size={14} className="text-emerald-600" />
                                        ) : (
                                            <Copy size={14} />
                                        )}
                                        {tersalin === p.supplierId ? "Tersalin!" : "Salin Rekening"}
                                    </button>
                                    <span className="text-xs font-semibold text-slate-500 ml-auto">
                                        a.n. <strong className="text-slate-800">{p.rekening.atasNama}</strong>
                                    </span>
                                </div>
                            )}

                            {p.dompetDigital && (
                                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm">
                                    <span className="flex flex-wrap gap-1.5">
                                        {p.dompetDigital.providers.map((prov) => (
                                            <span
                                                key={prov}
                                                className="rounded-lg bg-white px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200"
                                            >
                                                {LABEL_EWALLET[prov] ?? prov}
                                            </span>
                                        ))}
                                    </span>
                                    <span className="font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">{p.dompetDigital.nomor}</span>
                                    <button
                                        onClick={() =>
                                            salin(p.dompetDigital?.nomor ?? "", `${p.supplierId}-ewallet`)
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-blue-600 shadow-sm transition hover:bg-slate-50"
                                    >
                                        {tersalin === `${p.supplierId}-ewallet` ? (
                                            <Check size={14} className="text-emerald-600" />
                                        ) : (
                                            <Copy size={14} />
                                        )}
                                        {tersalin === `${p.supplierId}-ewallet` ? "Tersalin!" : "Salin Nomor"}
                                    </button>
                                    <span className="text-xs font-semibold text-slate-500 ml-auto">
                                        a.n. <strong className="text-slate-800">{p.dompetDigital.atasNama}</strong>
                                    </span>
                                </div>
                            )}

                            {!p.rekening && !p.dompetDigital && (
                                <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">
                                    ⚠️ Belum ada rekening atau dompet digital yang diisi oleh pemasok. Harap instruksikan mereka untuk melengkapi profil sebelum pencairan dilakukan.
                                </p>
                            )}

                            {tab === "pending" && (
                                <button
                                    onClick={() => setSasaran(p)}
                                    disabled={!p.rekening && !p.dompetDigital}
                                    className="mt-5 w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Tandai Sudah Diteruskan
                                </button>
                            )}

                            {tab === "paid" && p.buktiTransaksiId && (
                                <div className="mt-5 pt-4 border-t border-slate-100">
                                    <TombolLihatBukti
                                        transactionId={p.buktiTransaksiId}
                                        jenis="payout"
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Kontrol Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] mt-6">
                            <div className="text-xs font-medium text-slate-500">
                                Menampilkan halaman <strong className="text-slate-800">{currentPage}</strong> dari <strong className="text-slate-800">{totalPages}</strong>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={14} /> Sebelumnya
                                </button>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Berikutnya <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <p className="text-xs font-medium text-slate-400 text-center leading-relaxed">
                * Pengiriman dana saat ini dilakukan secara manual lewat *mobile banking* / m-banking, kemudian dicatat di sistem ini. Fitur transfer otomatis (*disbursement API*) akan aktif setelah integrasi payment gateway selesai sepenuhnya.
            </p>

            {sasaran && (
                <ModalTandaiPayout
                    pemasok={sasaran}
                    onTutup={() => setSasaran(null)}
                    onSelesai={async () => {
                        setSasaran(null);
                        await load();
                    }}
                />
            )}
        </div>
    );
}

function ModalTandaiPayout({
    pemasok,
    onTutup,
    onSelesai,
}: {
    pemasok: BarisPemasok;
    onTutup: () => void;
    onSelesai: () => void;
}) {
    const [berkas, setBerkas] = useState<File | null>(null);
    const [catatan, setCatatan] = useState("");
    const [sibuk, setSibuk] = useState(false);
    const [galat, setGalat] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    async function kirim() {
        if (!berkas) {
            setGalat("Harap unggah bukti transfer terlebih dahulu.");
            return;
        }

        setSibuk(true);
        setGalat(null);

        try {
            const form = new FormData();
            form.append("bukti", berkas);
            if (catatan.trim()) form.append("catatan", catatan.trim());

            await api.post(`/admin/payouts/${pemasok.supplierId}`, form);
            onSelesai();
        } catch (err) {
            setGalat(getApiErrorMessage(err));
        } finally {
            setSibuk(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={onTutup}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Tandai penerusan dana"
                className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                    <div>
                        <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Konfirmasi Pencairan</div>
                        <h3 className="font-display text-lg font-extrabold text-slate-900 mt-0.5">
                            Tandai Dana Diteruskan
                        </h3>
                    </div>
                    <button
                        onClick={onTutup}
                        aria-label="Tutup"
                        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-sm font-bold text-slate-900">{pemasok.groupName}</div>
                    <div className="mt-1 font-display text-2xl font-extrabold text-emerald-600">
                        {formatRupiah(pemasok.totalDiteruskan)}
                    </div>
                    {pemasok.rekening && (
                        <div className="mt-1.5 text-xs font-semibold text-slate-500">
                            {pemasok.rekening.bank} <span className="font-mono font-bold text-slate-700">{pemasok.rekening.nomor}</span> a.n. {pemasok.rekening.atasNama}
                        </div>
                    )}
                    {pemasok.dompetDigital && (
                        <div className="mt-1.5 text-xs font-semibold text-slate-500">
                            {pemasok.dompetDigital.providers.map((p) => LABEL_EWALLET[p] ?? p).join(" / ")}{" "}
                            <span className="font-mono font-bold text-slate-700">{pemasok.dompetDigital.nomor}</span> a.n. {pemasok.dompetDigital.atasNama}
                        </div>
                    )}
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900 leading-relaxed">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                    <span>
                        Pastikan Anda telah melakukan transfer dana via m-banking atau dompet digital sebelum menandainya di sini. Bukti transfer ini dapat dilihat langsung oleh pemasok.
                    </span>
                </div>

                <div className="mt-4">
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-3.5 text-xs font-bold text-slate-600 transition hover:border-blue-500 hover:bg-blue-50/30 hover:text-blue-600"
                    >
                        <Upload size={16} />
                        {berkas ? berkas.name : "Unggah Bukti Transfer (Foto/PDF)"}
                    </button>

                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setBerkas(e.target.files?.[0] ?? null)}
                        className="hidden"
                    />
                </div>

                <input
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Catatan / Nomor Referensi Transfer (opsional)"
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />

                {galat && (
                    <p className="mt-3 rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600">
                        {galat}
                    </p>
                )}

                <div className="mt-6 flex gap-3 pt-4 border-t border-slate-100">
                    <button
                        onClick={onTutup}
                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={kirim}
                        disabled={sibuk}
                        className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {sibuk ? "Menyimpan..." : "Simpan & Tandai Selesai"}
                    </button>
                </div>
            </div>
        </div>
    );
}