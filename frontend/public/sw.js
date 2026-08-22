const VERSI = "pangankreatif-v1";
const CACHE_STATIS = `${VERSI}-statis`;
const CACHE_HALAMAN = `${VERSI}-halaman`;

const BERKAS_AWAL = ["/", "/offline", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE_STATIS)
            .then((cache) => cache.addAll(BERKAS_AWAL))
            // Kegagalan menyimpan satu berkas tidak boleh membatalkan pemasangan
            .catch(() => undefined)
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((kunci) =>
                Promise.all(
                    kunci
                        .filter((k) => !k.startsWith(VERSI))
                        .map((k) => caches.delete(k))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    // Hanya tangani permintaan ke asal yang sama
    if (url.origin !== self.location.origin) return;

    // Panggilan data selalu langsung ke jaringan, tanpa disimpan
    if (url.pathname.startsWith("/api")) return;

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((respons) => {
                    const salinan = respons.clone();
                    caches.open(CACHE_HALAMAN).then((c) => c.put(request, salinan));
                    return respons;
                })
                .catch(async () => {
                    const tersimpan = await caches.match(request);
                    return tersimpan || caches.match("/offline") || Response.error();
                })
        );
        return;
    }

    // Berkas statis: pakai simpanan dulu supaya cepat
    if (
        url.pathname.startsWith("/_next/static") ||
        url.pathname.startsWith("/icons") ||
        url.pathname.startsWith("/images")
    ) {
        event.respondWith(
            caches.match(request).then((tersimpan) => {
                if (tersimpan) return tersimpan;

                return fetch(request).then((respons) => {
                    const salinan = respons.clone();
                    caches.open(CACHE_STATIS).then((c) => c.put(request, salinan));
                    return respons;
                });
            })
        );
    }
});