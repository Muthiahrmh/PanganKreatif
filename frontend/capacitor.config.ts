import type { CapacitorConfig } from '@capacitor/cli';

/**
 * PanganKreatif adalah aplikasi Next.js server-rendered (bukan static
 * export) — jadi APK ini TIDAK membundel file statis, melainkan
 * membuka situs produksi yang sudah live di dalam WebView native.
 * Ini pola resmi Capacitor untuk membungkus web app yang sudah
 * berjalan, bukan cara "curang" — hasilnya tetap APK asli yang
 * terinstall dan tampil sebagai aplikasi native di Android.
 *
 * Dikembalikan ke landing page ("/") sesuai kesepakatan tim
 * sebelumnya — SENGAJA tidak langsung ke /login atau /dashboard.
 */
const config: CapacitorConfig = {
  appId: 'id.pangankreatif.app',
  appName: 'PanganKreatif',
  webDir: 'public',
  server: {
    url: 'https://pangankreatif.my.id',
    androidScheme: 'https',
  },
};

export default config;
