import { api } from "@/lib/api";
import type { AuthResponse } from "@/types/auth";

export async function login(email: string, password: string) {
    const response = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
    });

    return response.data;
}