"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { ambilNotifikasi, waktuTerakhirDilihat } from "@/lib/notification";

export function PanelNotifikasi({ aksen }: { aksen: string }) {
    const pathname = usePathname();
    const [belumDilihat, setBelumDilihat] = useState(0);
    const [adaPerluTindakanBaru, setAdaPerluTindakanBaru] = useState(false);

    const muat = useCallback(async () => {
        try {
            const hasil = await ambilNotifikasi();
            const dilihat = waktuTerakhirDilihat();
            const belum = hasil.notifikasi.filter(
                (n) => new Date(n.waktu).getTime() > dilihat
            );

            setBelumDilihat(belum.length);
            setAdaPerluTindakanBaru(belum.some((n) => n.tingkat === "perlu_tindakan"));
        } catch {
            setBelumDilihat(0);
            setAdaPerluTindakanBaru(false);
        }
    }, []);

    useEffect(() => {
        muat();
    }, [muat, pathname]);

    const lencana = pathname === "/dashboard/notifikasi" ? 0 : belumDilihat;

    return (
        <Link
            href="/dashboard/notifikasi"
            aria-label={`Notifikasi${lencana > 0 ? `, ${lencana} baru` : ""}`}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
            <Bell size={18} className={lencana > 0 ? "animate-pulse" : ""} />

            {lencana > 0 && (
                <span
                    className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white px-1 text-[9px] font-extrabold text-white shadow-sm"
                    style={{ backgroundColor: adaPerluTindakanBaru ? "#EF4444" : aksen }}
                >
                    {lencana > 9 ? "9+" : lencana}
                </span>
            )}
        </Link>
    );
}