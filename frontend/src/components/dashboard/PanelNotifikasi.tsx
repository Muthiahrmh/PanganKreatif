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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        muat();
    }, [muat, pathname]);

    const lencana = pathname === "/dashboard/notifikasi" ? 0 : belumDilihat;

    return (
        <Link
            href="/dashboard/notifikasi"
            aria-label={`Notifikasi${lencana > 0 ? `, ${lencana} baru` : ""}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-paper-soft text-ink-soft transition hover:bg-slate-100"
        >
            <Bell size={18} />

            {lencana > 0 && (
                <span
                    className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                    style={{ backgroundColor: adaPerluTindakanBaru ? "#D97706" : aksen }}
                >
                    {lencana > 9 ? "9+" : lencana}
                </span>
            )}
        </Link>
    );
}