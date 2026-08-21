export type StatusPembayaran = "pending" | "success" | "failed";

export interface SesiPembayaran {
    transactionId: string;
    orderId: string;
    snapToken: string;
    redirectUrl?: string;
    amount: number;
    clientKey: string;
    produksi: boolean;
    dipakaiUlang?: boolean;
}

export type JenisKanal = "bank" | "ewallet" | "cash";

export interface KanalManual {
    kode: string;
    nama: string;
    jenis: JenisKanal;
    /** Nomor rekening atau nomor e-wallet tujuan; null untuk tunai */
    tujuan: string | null;
    atasNama: string | null;
    keterangan: string;
}

export interface InfoPembayaran {
    gatewayAktif: boolean;
    komisiPersen: number;
    /** Tujuan pembayaran manual, semuanya rekening penampungan platform */
    kanalManual: KanalManual[];
}

export interface StatusResponse {
    status: StatusPembayaran;
    channel: string | null;
    daring: boolean;
    orderId?: string;
    amount?: number;
    keterangan?: string;
}

/** Snap disuntikkan ke window oleh skrip Midtrans */
declare global {
    interface Window {
        snap?: {
            pay: (
                token: string,
                opsi: {
                    onSuccess?: (hasil: unknown) => void;
                    onPending?: (hasil: unknown) => void;
                    onError?: (hasil: unknown) => void;
                    onClose?: () => void;
                }
            ) => void;
        };
    }
}