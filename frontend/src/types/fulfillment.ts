/**
 * Serah terima barang — status yang berjalan berdampingan dengan status
 * pembayaran. Uang UMKM ditahan platform sampai kolom ini bernilai
 * "diterima"; baru setelah itu admin boleh meneruskannya ke pemasok.
 */
export type FulfillmentStatus = "menunggu" | "dikirim" | "diterima" | "komplain";

/** Bagian yang menempel di setiap item pesanan, dari mana pun diambil. */
export interface JejakFulfillment {
    fulfillmentStatus?: FulfillmentStatus;
    statusBarang?: string;
    shippedAt?: string | null;
    receivedAt?: string | null;
    autoConfirmAt?: string | null;
    /** Sisa waktu sebelum konfirmasi otomatis; null kalau tidak berlaku */
    sisaJamKonfirmasi?: number | null;
    complaintAt?: string | null;
    complaintNote?: string | null;
    batasKonfirmasiHari?: number;
}

/** Satu pesanan yang dananya sedang ditahan, dari sisi admin. */
export interface PesananDitahan {
    transactionId: string;
    itemId: string;
    amount: number;
    supplierPayout: number;
    quantity: number;
    fulfillmentStatus: FulfillmentStatus;
    statusLabel: string;
    shippedAt: string | null;
    autoConfirmAt: string | null;
    sisaJam: number | null;
    complaintAt: string | null;
    complaintNote: string | null;
    dibayarPada: string;
    umkm: { businessName: string; city: string };
    supplier: { id: string; groupName: string };
    product: { name: string; unit: string };
}

export interface DataEscrowAdmin {
    batasKonfirmasiHari: number;
    ringkasan: {
        jumlahPesanan: number;
        totalDitahan: number;
        belumDikirim: number;
        dalamPengiriman: number;
        komplain: number;
    };
    pesanan: PesananDitahan[];
}

/** Ringkasan satu pesanan tertahan, seperti yang menempel di rekap payout. */
export interface RingkasanDitahan {
    itemId: string;
    umkm: string;
    produk: string;
    jumlah: number;
    satuan: string;
    nilai: number;
    fulfillmentStatus: FulfillmentStatus;
    statusLabel: string;
    shippedAt: string | null;
    autoConfirmAt: string | null;
    sisaJam: number | null;
    complaintNote: string | null;
}
