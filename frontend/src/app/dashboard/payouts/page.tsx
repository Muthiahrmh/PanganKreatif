"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Wallet, AlertTriangle, Check, Copy, Landmark, Upload, X } from "lucide-react";
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

interface BarisPemasok {
    supplierId: string;
    groupName: string;
    city: string;
    rekening: Rekening | null;
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

/**
 * Pencatatan penerusan dana dari platform ke pemasok.
 *
 * Uang UMKM masuk lebih dulu ke rekening platform. Komisi tinggal
 * di platform, sisanya menjadi kewajiban yang harus diteruskan.
 * Halaman ini mencatat mana yang sudah dikirim.
 *
 * Pengirimannya masih dilakukan manual lewat mobile banking.
 * Pengiriman otomatis lewat layanan disbursement menyusul setelah
 * akun produksi terverifikasi.
 */
export default function PayoutsPage() {
    const user = useAuthStore((s) => s.user);

    const [tab, setTab] = useState<"pending" | "paid">("pending");
    const [data, setData] = useState<DataPayout | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tersalin, setTersalin] = useState<string | null>(null);
    const [sasaran, setSasaran] = useState<BarisPemasok | null>(null);

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
        return <p className="text-sm text-ink-soft">Halaman ini khusus untuk admin platform.</p>;
    }

    const r = data?.ringkasan;

    return (
        <div className="flex flex-col gap-5">
            <p className="text-sm text-ink-soft">
                Pembayaran UMKM ditampung di rekening platform. Komisi tinggal di PanganKreatif,
                sisanya diteruskan ke pemasok. Halaman ini mencatat mana yang sudah dikirim.
            </p>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    icon={Wallet}
                    label={tab === "pending" ? "Perlu Diteruskan" : "Sudah Diteruskan"}
                    value={loading ? "..." : formatRupiah(r?.totalDiteruskan ?? 0)}
                    sub={`${r?.jumlahPemasok ?? 0} pemasok · ${r?.jumlahTransaksi ?? 0} transaksi`}
                    color={tab === "pending" ? "text-amber-500" : "text-brand-green"}
                />
                <StatCard
                    icon={Landmark}
                    label="Nilai Transaksi"
                    value={loading ? "..." : formatRupiah(r?.totalNilai ?? 0)}
                    sub="Dibayar UMKM"
                />
                <StatCard
                    icon={Check}
                    label="Komisi Platform"
                    value={loading ? "..." : formatRupiah(r?.totalKomisi ?? 0)}
                    sub="Bagian PanganKreatif"
                    color="text-brand-green"
                />
            </div>

            {tab === "pending" && (r?.tanpaRekening ?? 0) > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>
                        {r?.tanpaRekening} pemasok belum mencantumkan rekening. Dananya tidak bisa
                        diteruskan sampai mereka melengkapi profil.
                    </span>
                </div>
            )}

            <div className="flex gap-2">
                {(["pending", "paid"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => {
                            setTab(t);
                            setLoading(true);
                        }}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${tab === t
                                ? "bg-brand-blue text-white"
                                : "bg-paper-soft text-ink-soft hover:text-ink"
                            }`}
                    >
                        {t === "pending" ? "Perlu diteruskan" : "Sudah diteruskan"}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                </div>
            ) : (data?.pemasok.length ?? 0) === 0 ? (
                <div className="rounded-xl border border-dashed border-ink/15 bg-white p-10 text-center">
                    <Wallet size={26} className="mx-auto text-ink-soft" />
                    <h3 className="mt-3 font-display text-base font-bold text-ink">
                        {tab === "pending"
                            ? "Tidak ada dana tertunda"
                            : "Belum ada dana yang diteruskan"}
                    </h3>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
                        {tab === "pending"
                            ? "Semua kewajiban ke pemasok sudah diselesaikan."
                            : "Dana yang sudah diteruskan akan tercatat di sini."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {data?.pemasok.map((p) => (
                        <div
                            key={p.supplierId}
                            className="rounded-xl border border-ink/5 bg-white p-5 shadow-sm"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="font-display text-base font-bold text-ink">
                                        {p.groupName}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-ink-soft">
                                        {p.city} · {p.jumlahTransaksi} transaksi
                                        {p.transaksiTerakhir &&
                                            ` · terakhir ${formatDate(p.transaksiTerakhir)}`}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <div className="font-display text-lg font-bold text-brand-green">
                                        {formatRupiah(p.totalDiteruskan)}
                                    </div>
                                    <div className="text-xs text-ink-soft">
                                        dari {formatRupiah(p.totalNilai)} · komisi{" "}
                                        {formatRupiah(p.totalKomisi)}
                                    </div>
                                </div>
                            </div>

                            {p.rekening ? (
                                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-paper-soft px-3 py-2.5 text-sm">
                                    <span className="font-medium text-ink">{p.rekening.bank}</span>
                                    <span className="font-data text-ink">{p.rekening.nomor}</span>
                                    <button
                                        onClick={() =>
                                            salin(p.rekening?.nomor ?? "", p.supplierId)
                                        }
                                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-brand-blue transition hover:bg-blue-50"
                                    >
                                        {tersalin === p.supplierId ? (
                                            <Check size={12} />
                                        ) : (
                                            <Copy size={12} />
                                        )}
                                        {tersalin === p.supplierId ? "Tersalin" : "Salin"}
                                    </button>
                                    <span className="text-xs text-ink-soft">
                                        a.n. {p.rekening.atasNama}
                                    </span>
                                </div>
                            ) : (
                                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                    Rekening belum diisi pemasok. Minta mereka melengkapi profil
                                    sebelum dana bisa dikirim.
                                </p>
                            )}

                            {tab === "pending" && (
                                <button
                                    onClick={() => setSasaran(p)}
                                    disabled={!p.rekening}
                                    className="mt-3 w-full rounded-lg bg-brand-green px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Tandai sudah diteruskan
                                </button>
                            )}

                            {tab === "paid" && p.buktiTransaksiId && (
                                <div className="mt-3">
                                    <TombolLihatBukti
                                        transactionId={p.buktiTransaksiId}
                                        jenis="payout"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <p className="text-xs text-ink-soft">
                Pengiriman dana masih dilakukan manual lewat mobile banking, lalu dicatat di sini.
                Pengiriman otomatis menyusul setelah akun payment gateway produksi terverifikasi.
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

/**
 * Menandai penerusan dana harus disertai bukti transfer,
 * karena pemasok berhak memeriksanya di halaman mereka.
 */
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
            setGalat("Unggah bukti transfer dulu.");
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
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center"
            onClick={onTutup}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Tandai penerusan dana"
                className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-base font-bold text-ink">
                        Tandai dana diteruskan
                    </h3>
                    <button
                        onClick={onTutup}
                        aria-label="Tutup"
                        className="rounded-lg p-1 text-ink-soft transition hover:bg-paper-soft"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-4 rounded-lg bg-paper-soft p-3">
                    <div className="text-sm font-medium text-ink">{pemasok.groupName}</div>
                    <div className="mt-1 font-display text-xl font-bold text-brand-green">
                        {formatRupiah(pemasok.totalDiteruskan)}
                    </div>
                    {pemasok.rekening && (
                        <div className="mt-1 text-xs text-ink-soft">
                            {pemasok.rekening.bank} {pemasok.rekening.nomor} a.n.{" "}
                            {pemasok.rekening.atasNama}
                        </div>
                    )}
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    <span>
                        Lakukan transfer lebih dulu lewat mobile banking, baru tandai di sini.
                        Buktinya bisa dilihat pemasok di halaman Pembayaran mereka.
                    </span>
                </div>

                <div className="mt-3">
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ink/20 px-3 py-3 text-xs text-ink-soft transition hover:border-brand-blue hover:text-brand-blue"
                    >
                        <Upload size={14} />
                        {berkas ? berkas.name : "Unggah bukti transfer"}
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
                    placeholder="Catatan, misal nomor referensi transfer (opsional)"
                    className="mt-3 w-full rounded-lg border border-ink/10 px-3 py-2 text-xs outline-none transition focus:border-brand-blue"
                />

                {galat && (
                    <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                        {galat}
                    </p>
                )}

                <div className="mt-4 flex gap-3">
                    <button
                        onClick={onTutup}
                        className="flex-1 rounded-lg border border-ink/10 px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-paper-soft"
                    >
                        Batal
                    </button>
                    <button
                        onClick={kirim}
                        disabled={sibuk}
                        className="flex-1 rounded-lg bg-brand-green px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-green-dark disabled:opacity-60"
                    >
                        {sibuk ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </div>
        </div>
    );
}