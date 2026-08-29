/**
 * Geocoding alamat -> koordinat, pakai Nominatim (OpenStreetMap).
 *
 * Layanan publik gratis tanpa API key, tapi kebijakan pemakaiannya
 * membatasi maksimal 1 permintaan/detik dan mewajibkan User-Agent yang
 * jelas. Karena itu, geocoding HANYA dipanggil sekali saat alamat
 * disimpan (daftar/ubah profil) — bukan setiap kali menampilkan jarak —
 * hasilnya disimpan permanen di kolom latitude/longitude.
 *
 * Kalau geocoding gagal (alamat tidak dikenali, layanan tidak bisa
 * dihubungi, dsb), profil tetap disimpan tanpa koordinat presisi —
 * utils/jarak.js otomatis jatuh kembali ke perkiraan titik-pusat-kota.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

/**
 * @param {{ alamat?: string, kota?: string }} params
 * @returns {Promise<{lat: number, lon: number}|null>}
 */
async function geocodeAlamat({ alamat, kota }) {
    const query = [alamat, kota, 'Indonesia'].filter(Boolean).join(', ');
    if (!query || query === 'Indonesia') return null;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const url = `${NOMINATIM_BASE}?${new URLSearchParams({
            q: query,
            format: 'jsonv2',
            limit: '1',
            countrycodes: 'id',
        })}`;

        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                // Wajib diisi sesuai kebijakan Nominatim, supaya permintaan
                // tidak diblokir dan bisa dilacak kalau ada masalah.
                'User-Agent': 'PanganKreatif/1.0 (aplikasi KMIPN; kontak: pangankreatif08@gmail.com)',
                Accept: 'application/json',
            },
        });
        clearTimeout(timeout);

        if (!res.ok) {
            console.warn(`Nominatim membalas status ${res.status} untuk "${query}"`);
            return null;
        }

        const data = await res.json();
        const hasil = Array.isArray(data) ? data[0] : null;
        if (!hasil) return null;

        const lat = Number(hasil.lat);
        const lon = Number(hasil.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

        return { lat, lon };
    } catch (err) {
        console.warn(`Geocoding gagal untuk "${query}":`, err.message);
        return null;
    }
}

module.exports = { geocodeAlamat };
