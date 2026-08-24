import axios from "axios";
import { useAuthStore } from "@/store/authStore";

export const api = axios.create({
    baseURL: "http://localhost:4000/api",
});

// Sisipin token JWT otomatis ke tiap request kalau user udah login
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Kalau token kedaluwarsa/invalid, otomatis logout
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    },
);

export function getApiErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: unknown } | undefined;
        if (typeof data?.error === "string") return data.error;
        if (data?.error && typeof data.error === "object") {
        // Error validasi zod (flatten) — ambil pesan pertama yang ada
        const flat = data.error as {
            fieldErrors?: Record<string, string[]>;
            formErrors?: string[];
        };
        const firstField = Object.values(flat.fieldErrors || {}).flat()[0];
        if (firstField) return firstField;
        if (flat.formErrors?.[0]) return flat.formErrors[0];
        }
        return "Terjadi kesalahan, coba lagi.";
    }
    return "Terjadi kesalahan, coba lagi.";
}
