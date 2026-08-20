import { api } from "@/lib/api";
import type { ProfilePayload, User } from "@/types/auth";

export async function fetchProfile() {
    const res = await api.get<User>("/auth/profile");
    return res.data;
}

export async function updateProfile(payload: ProfilePayload) {
    const res = await api.patch<User>("/auth/profile", payload);
    return res.data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
    const res = await api.patch("/auth/password", { currentPassword, newPassword });
    return res.data;
}

export async function uploadAvatar(file: File) {
    const form = new FormData();
    form.append("avatar", file);

    const res = await api.post<User>("/auth/avatar", form);
    return res.data;
}

export async function deleteAvatar() {
    const res = await api.delete<User>("/auth/avatar");
    return res.data;
}