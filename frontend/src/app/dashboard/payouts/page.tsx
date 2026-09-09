"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Wallet, AlertTriangle, Check, Copy, Upload, X, ChevronLeft, ChevronRight, Lock, ShieldCheck, Truck, PackageCheck, MessageCircleWarning, Unlock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { temaPeran } from "@/components/dashboard/roleTheme";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatDate, formatRupiah } from "@/lib/format";
import { StatCard } from "@/components/dashboard/StatCard";
import { TombolLihatBukti } from "@/components/dashboard/TombolLihatBukti";
import { GAYA_FULFILLMENT, lepasPaksaEscrow, sisaWaktuKonfirmasi } from "@/lib/fulfillment";
import type { RingkasanDitahan } from "@/types/fulfillment";

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
    /** Hanya terisi pada keranjang "ditahan" */
    pesananDitahan?: RingkasanDitahan[];
}

type KeranjangPayout = "ditahan" | "pending" | "paid";

interface DataPayout {
    status: KeranjangPayout;
    batasKonfirmasiHari?: number;
    ringkasan: {
        jumlahPemasok: number;
        jumlahTransaksi: number;
        totalNilai: number;
        totalKomisi: number;
        totalDiteruskan: number;
        tanpaRekening: number;
    };
    escrow?: {
        jumlahTransaksiDitahan: number;
        totalDitahan: number;
    };
    pemasok: BarisPemasok[];
}

const LABEL_TAB: Record<KeranjangPayout, string> = {
    ditahan: "Ditahan",
    pending: "Perlu Diteruskan",
    paid: "Sudah Diteruskan",
};

const ITEMS_PER_PAGE = 5;

export default function PayoutsPage() {
    const user = useAuthStore((s) => s.user);
    const tema = temaPeran(user?.role ?? "admin");
    const warnaPeran = {
        "--warna-peran": tema.aksen,
        "--warna-peran-latar": tema.latar,
        "--warna-gelap": tema.sidebar,
    } as CSSProperties;

    const [tab, setTab] = useState<KeranjangPayout>("pending");
    const [lepasSasaran, setLepasSasaran] = useState<RingkasanDitahan | null>(null);
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
        <div className="flex flex-col gap-6 md:gap-8 pb-10" style={warnaPeran}>
            {/* Hero Header — gradasi gelap bernuansa warna peran */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[var(--warna-gelap)] via-[var(--warna-gelap)] to-[var(--warna-peran)] p-6 sm:p-10 text-white shadow-2xl shadow-black/10">
                <div
                    className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-[70px]"
                    style={{ backgroundColor: "var(--warna-peran)", opacity: 0.4 }}
                />
                <div
                    className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full blur-[60px]"
                    style={{ backgroundColor: "var(--warna-peran)", opacity: 0.2 }}
                />
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                        Manajemen Keuangan & Kliring
                    </div>
                    <h2 className="mt-4 font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
                        Penerusan Dana (Payouts)
                    </h2>
                    <p className="mt-2 text-sm font-medium text-white/70 max-w-2xl leading-relaxed">
                        Pembayaran UMKM ditampung di rekening platform sebagai rekening bersama. Dana baru bisa diteruskan ke pemasok setelah UMKM menekan &ldquo;Barang Sudah Diterima&rdquo;{data?.batasKonfirmasiHari ? `, atau otomatis ${data.batasKonfirmasiHari} hari setelah barang dikirim` : ""}.
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700 shadow-sm">
                    {error}
                </div>
            )}

            {/* Kotak Statistik Utama */}
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    icon={tab === "ditahan" ? Lock : Wallet}
                    label={LABEL_TAB[tab]}
                    value={loading ? "..." : formatRupiah(r?.totalDiteruskan ?? 0)}
                    sub={`${r?.jumlahPemasok ?? 0} pemasok · ${r?.jumlahTransaksi ?? 0} transaksi`}
                    color={
                        tab === "ditahan"
                            ? "text-slate-500"
                            : tab === "pending"
                                ? "text-amber-500"
                                : "text-emerald-600"
                    }
                />
                <StatCard
                    icon={ShieldCheck}
                    label="Dana Ditahan Platform"
                    value={loading ? "..." : formatRupiah(data?.escrow?.totalDitahan ?? 0)}
                    sub={`${data?.escrow?.jumlahTransaksiDitahan ?? 0} pesanan menunggu konfirmasi UMKM`}
                    color="text-slate-500"
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

            {/* Tiga keranjang: ditahan → siap diteruskan → sudah diteruskan */}
            <div className="flex gap-2 rounded-2xl bg-slate-200/70 p-1.5 shadow-inner">
                {(["ditahan", "pending", "paid"] as const).map((t) => (
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
                        <span className="inline-flex items-center gap-1.5">
                            {t === "ditahan" && <Lock size={12} />}
                            {LABEL_TAB[t]}
                            {t === "ditahan" && (data?.escrow?.jumlahTransaksiDitahan ?? 0) > 0 && (
                                <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                                    {data?.escrow?.jumlahTransaksiDitahan}
                                </span>
                            )}
                        </span>
                    </button>
                ))}
            </div>

            {tab === "ditahan" && (
                <div className="flex items-start gap-3 rounded-2xl border border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-700 shadow-sm">
                    <Lock size={18} className="mt-0.5 shrink-0 text-slate-500" />
                    <span className="leading-relaxed">
                        Uang di keranjang ini <strong className="text-slate-900">sudah masuk rekening platform</strong> tapi belum boleh diteruskan: UMKM-nya belum menyatakan barangnya diterima. Tombol penerusan sengaja dikunci di sini — dana akan pindah sendiri ke tab &ldquo;Perlu Diteruskan&rdquo; begitu UMKM mengonfirmasi{data?.batasKonfirmasiHari ? `, atau ${data.batasKonfirmasiHari} hari setelah barang dikirim` : ""}.
                    </span>
                </div>
            )}

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
                        {tab === "ditahan"
                            ? "Tidak ada dana yang sedang ditahan"
                            : tab === "pending"
                                ? "Tidak ada dana tertunda saat ini"
                                : "Belum ada riwayat dana yang diteruskan"}
                    </h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 leading-relaxed">
                        {tab === "ditahan"
                            ? "Semua pesanan yang sudah dibayar juga sudah dikonfirmasi diterima UMKM."
                            : tab === "pending"
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
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-[var(--warna-peran)] shadow-sm transition hover:bg-slate-50"
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
                                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--warna-peran)]/20 bg-[var(--warna-peran-latar)] p-4 text-sm">
                                    <span className="flex flex-wrap gap-1.5">
                                        {p.dompetDigital.providers.map((prov) => (
                                            <span
                                                key={prov}
                                                className="rounded-lg bg-white px-2 py-0.5 text-xs font-bold text-[var(--warna-peran)] border border-[var(--warna-peran)]/30"
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
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-[var(--warna-peran)] shadow-sm transition hover:bg-slate-50"
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

                            {/* Rincian kenapa dana pemasok ini belum bisa cair */}
                            {tab === "ditahan" && (
                                <div className="mt-5 space-y-2.5">
                                    {(p.pesananDitahan ?? []).map((d) => {
                                        const gaya = GAYA_FULFILLMENT[d.fulfillmentStatus];
                                        const sisa = sisaWaktuKonfirmasi(d.sisaJam);

                                        return (
                                            <div
                                                key={d.itemId}
                                                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span
                                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ring-1 ring-inset ${gaya.className}`}
                                                        >
                                                            {d.fulfillmentStatus === "menunggu" && <Wallet size={11} />}
                                                            {d.fulfillmentStatus === "dikirim" && <Truck size={11} />}
                                                            {d.fulfillmentStatus === "diterima" && <PackageCheck size={11} />}
                                                            {d.fulfillmentStatus === "komplain" && <MessageCircleWarning size={11} />}
                                                            {gaya.label}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-900">
                                                            {d.umkm}
                                                        </span>
                                                    </div>

                                                    <p className="mt-1.5 text-[11px] font-semibold text-slate-500 leading-relaxed">
                                                        {d.produk} {d.jumlah} {d.satuan} · {formatRupiah(d.nilai)}
                                                        {d.fulfillmentStatus === "menunggu" &&
                                                            " · pemasok belum menandai barang dikirim"}
                                                        {d.fulfillmentStatus === "dikirim" &&
                                                            (sisa
                                                                ? ` · konfirmasi otomatis ${sisa}`
                                                                : " · menunggu konfirmasi UMKM")}
                                                        {d.fulfillmentStatus === "komplain" &&
                                                            ` · komplain: ${d.complaintNote ?? "tanpa keterangan"}`}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => setLepasSasaran(d)}
                                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-[11px] font-bold text-amber-800 shadow-sm transition hover:bg-amber-100"
                                                >
                                                    <Unlock size={13} /> Lepas Paksa
                                                </button>
                                            </div>
                                        );
                                    })}

                                    <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-400">
                                        <Lock size={14} /> Penerusan dana terkunci untuk pemasok ini
                                    </div>
                                </div>
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

            {lepasSasaran && (
                <ModalLepasPaksa
                    pesanan={lepasSasaran}
                    onTutup={() => setLepasSasaran(null)}
                    onSelesai={async () => {
                        setLepasSasaran(null);
                        await load();
                    }}
                />
            )}
        </div>
    );
}

/**
 * Jalan keluar untuk kasus buntu — UMKM tak bisa dihubungi, atau
 * komplainnya sudah diselesaikan di luar sistem.
 *
 * Sengaja dibuat lebih berat daripada tombol payout biasa: alasan wajib
 * diisi, tersimpan bersama identitas admin yang menekannya, dan bisa
 * ditelusuri belakangan. Jalan pintas boleh ada, asal meninggalkan jejak.
 */
function ModalLepasPaksa({
    pesanan,
    onTutup,
    onSelesai,
}: {
    pesanan: RingkasanDitahan;
    onTutup: () => void;
    onSelesai: () => void;
}) {
    const [alasan, setAlasan] = useState("");
    const [sibuk, setSibuk] = useState(false);
    const [galat, setGalat] = useState<string | null>(null);

    async function kirim() {
        if (alasan.trim().length < 10) {
            setGalat("Alasan wajib diisi minimal 10 karakter.");
            return;
        }

        setSibuk(true);
        setGalat(null);
        try {
            await lepasPaksaEscrow(pesanan.itemId, alasan.trim());
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
                aria-label="Lepas dana secara paksa"
                className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                    <div>
                        <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                            Penyelesaian Sengketa
                        </div>
                        <h3 className="font-display text-lg font-extrabold text-slate-900 mt-0.5">
                            Lepas Dana Tanpa Konfirmasi UMKM
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
                    <div className="text-sm font-bold text-slate-900">{pesanan.umkm}</div>
                    <div className="mt-0.5 text-xs font-semibold text-slate-500">
                        {pesanan.produk} {pesanan.jumlah} {pesanan.satuan}
                    </div>
                    <div className="mt-1.5 font-display text-2xl font-extrabold text-amber-600">
                        {formatRupiah(pesanan.nilai)}
                    </div>
                    {pesanan.complaintNote && (
                        <p className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-semibold text-red-700 leading-relaxed">
                            Komplain UMKM: &ldquo;{pesanan.complaintNote}&rdquo;
                        </p>
                    )}
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900 leading-relaxed">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                    <span>
                        Tindakan ini melewati konfirmasi UMKM. Alasanmu tersimpan permanen bersama identitas akun admin ini dan dapat diperiksa kembali sewaktu-waktu.
                    </span>
                </div>

                <textarea
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    rows={3}
                    placeholder="Contoh: UMKM tidak bisa dihubungi selama 2 minggu, barang dipastikan sampai lewat bukti foto pemasok."
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-800 outline-none transition focus:border-[var(--warna-peran)] focus:bg-white focus:ring-1 focus:ring-[var(--warna-peran)]"
                />

                {galat && (
                    <p className="mt-3 rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600">{galat}</p>
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
                        className="flex-1 rounded-2xl bg-amber-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-amber-700 disabled:opacity-60"
                    >
                        {sibuk ? "Memproses..." : "Lepas Dana"}
                    </button>
                </div>
            </div>
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
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-3.5 text-xs font-bold text-slate-600 transition hover:border-[var(--warna-peran)] hover:bg-[var(--warna-peran-latar)] hover:text-[var(--warna-peran)]"
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
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-800 outline-none transition focus:border-[var(--warna-peran)] focus:bg-white focus:ring-1 focus:ring-[var(--warna-peran)]"
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