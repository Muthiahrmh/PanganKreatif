import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "PanganKreatif — Rantai Pasok Bahan Baku Kuliner",
        short_name: "PanganKreatif",
        description:
            "Prediksi kebutuhan bahan baku dan belanja kolektif untuk UMKM kuliner bersama kelompok tani.",
        start_url: "/dashboard",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#F5F9FF",
        theme_color: "#16A34A",
        lang: "id",
        categories: ["business", "productivity", "food"],
        icons: [
            {
                src: "/icons/icon-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icons/icon-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                // Ikon maskable diberi ruang kosong di tepinya, supaya
                // tidak terpotong saat Android memakai bentuk bulat
                src: "/icons/icon-maskable-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
        shortcuts: [
            {
                name: "Belanja Kolektif",
                short_name: "Belanja",
                url: "/dashboard/procurement",
            },
            {
                name: "Catat Penjualan",
                short_name: "Penjualan",
                url: "/dashboard/sales",
            },
            {
                name: "Prediksi AI",
                short_name: "Prediksi",
                url: "/dashboard/forecast",
            },
        ],
    };
}