import { api } from "@/lib/api";
import type { PrakiraanCuaca } from "@/types/weather";

export async function fetchPrakiraanCuaca(city?: string) {
    const res = await api.get<PrakiraanCuaca>("/weather/forecast", {
        params: city ? { city } : undefined,
    });
    return res.data;
}