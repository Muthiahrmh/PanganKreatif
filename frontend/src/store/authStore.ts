import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/auth";

interface AuthState {
    user: User | null;
    token: string | null;
    hydrated: boolean;

    setHydrated: (value: boolean) => void;
    setAuth: (user: User, token: string) => void;
    updateUser: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            hydrated: false,

            setHydrated: (value) => set({ hydrated: value }),

            setAuth: (user, token) => set({ user, token }),

            // Dipakai setelah profil atau foto diubah, token tetap sama
            updateUser: (user) => set({ user }),

            logout: () => set({ user: null, token: null }),
        }),
        {
            name: "pangankreatif-auth",

            // hydrated cuma status runtime, jangan ikut disimpan ke localStorage
            partialize: (state) => ({
                user: state.user,
                token: state.token,
            }),

            // Pakai parameter `state` dari zustand, jangan useAuthStore.getState().
            // localStorage sinkron, jadi callback ini jalan saat create() belum
            // selesai dan variabel useAuthStore masih kosong.
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
            },
        }
    )
);