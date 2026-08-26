Created pangan_kreatif_deployment_guide.md

Saya telah merangkum semua kode *script* dan langkah-langkahnya ke dalam sebuah dokumen panduan! Silakan buka dan baca dokumen `pangan_kreatif_deployment_guide.md` yang baru saja saya buat di layar Anda.

Di dalam dokumen tersebut, Anda akan menemukan 4 hal penting yang bisa Anda *copy-paste* langsung:
1. Kode `Dockerfile` untuk diletakkan di folder `backend/`
2. Kode `Dockerfile` untuk diletakkan di folder `frontend/`
3. Kode `deploy.yml` untuk GitHub Actions (CI/CD)
4. Langkah mengeksekusi *Docker Compose* di VPS Anda dan menyambungkannya ke Nginx Proxy Manager (menggunakan *network* yang sama dengan Petrochain).

Cukup salin kode-kode tersebut ke dalam folder lokal Pangan Kreatif Anda (di `E:\KMIPN\web pangan kreatif\PanganKreatif`), lalu lakukan `git push`. GitHub Actions akan otomatis bekerja sesuai dengan CI/CD yang kita buat!

Silakan dicek, apakah ada bagian dari *script* atau langkah tersebut yang ingin Anda tanyakan atau modifikasi (misalnya terkait penggunaan *database* atau versi Node.js)?

# 🚀 Panduan Lengkap CI/CD & Deployment Pangan Kreatif

Dokumen ini berisi semua konfigurasi yang Anda butuhkan untuk melakukan otomatisasi deployment (CI/CD) aplikasi **Pangan Kreatif** ke VPS Anda.

## 1. Persiapan Repositori (Lokal)

Buka folder `E:\KMIPN\web pangan kreatif\PanganKreatif` di VS Code Anda. Tambahkan 3 file berikut ini ke dalam proyek Anda.

### A. Dockerfile untuk Backend
Buat file baru bernama persis `Dockerfile` (tanpa ekstensi) di dalam folder `backend/`:

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
# Jika pakai prisma, copy foldernya
COPY prisma ./prisma/ 

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client (Hapus baris ini jika tidak pakai Prisma)
RUN npx prisma generate

# Build TypeScript (Hapus baris ini jika backend tidak pakai TypeScript)
# RUN npm run build

# Ekspos port backend (Pastikan sesuai dengan port express, misal 8003)
EXPOSE 8003

# Command untuk start backend (sesuaikan dengan script start di package.json Anda)
CMD ["npm", "run", "start"]
```

### B. Dockerfile untuk Frontend
Buat file baru bernama persis `Dockerfile` (tanpa ekstensi) di dalam folder `frontend/`:

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

# Copy built assets dari stage builder
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Ekspos port frontend (Port bawaan Next.js adalah 3000, tapi kita bisa pakai 8002)
EXPOSE 8002
ENV PORT 8002

CMD ["npm", "run", "start"]
```

### C. Konfigurasi CI/CD (GitHub Actions)
Buat folder `.github/workflows/` (jika belum ada) di dalam folder paling luar (sejajar dengan folder `backend` & `frontend`), lalu buat file `deploy.yml` di dalamnya:

```yaml
# .github/workflows/deploy.yml
name: Build and Push Docker Images

on:
  push:
    branches:
      - main # Akan berjalan otomatis setiap ada push ke branch main

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write # Penting untuk bisa push ke GHCR

    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Login to GitHub Container Registry (GHCR)
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }} # Disediakan otomatis oleh GitHub

      - name: Build and Push Backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/pangan-backend:latest

      - name: Build and Push Frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/pangan-frontend:latest
```
> [!TIP]
> Setelah Anda menyimpan ketiga file di atas, lakukan `git add .`, `git commit -m "Add Docker and CI/CD"`, lalu `git push` ke GitHub. GitHub akan otomatis mem-build image Anda!

---

## 2. Setup Server (Di dalam VPS)

Setelah GitHub Actions selesai (*centang hijau* di GitHub), masuklah ke VPS Anda lewat SSH (seperti yang Anda lakukan tadi) untuk menjalankan aplikasinya.

### A. Buat Konfigurasi Docker Compose Pangan Kreatif
Jalankan perintah ini di VPS Anda untuk membuat foldernya:
```bash
mkdir -p /root/pangankreatif
cd /root/pangankreatif
nano docker-compose.yml
```

Lalu, *paste* kode konfigurasi ini ke dalam editor `nano` tersebut:
```yaml
version: '3.8'

services:
  pangan_backend:
    # Ganti "Muthiahrmh" dengan username GitHub pemilik repositori jika berbeda
    image: ghcr.io/Muthiahrmh/pangan-backend:latest
    container_name: pangan_backend
    restart: always
    environment:
      # Sesuaikan URL Supabase Anda di sini
      - DATABASE_URL=postgres://postgres:password@db.supabase.co:5432/postgres 
    networks:
      - proxy_default

  pangan_frontend:
    image: ghcr.io/Muthiahrmh/pangan-frontend:latest
    container_name: pangan_frontend
    restart: always
    environment:
      # URL Backend jika diperlukan oleh Frontend
      - NEXT_PUBLIC_API_URL=https://api.pangankreatif.my.id 
    networks:
      - proxy_default

networks:
  # Kita sambungkan ke network Nginx Proxy Manager milik Petrochain yang sudah ada
  proxy_default:
    external: true
```
Tekan `Ctrl + X`, lalu `Y`, lalu `Enter` untuk menyimpan file `nano`.

Lalu, nyalakan aplikasinya dengan perintah:
```bash
docker-compose up -d
```

### B. Konfigurasi Domain (Nginx Proxy Manager)
1. Buka dashboard Nginx Proxy Manager Anda di browser (biasanya port 81).
2. Tambahkan **Proxy Host** baru.
3. **Domain Names**: Masukkan `pangankreatif.my.id`
4. **Scheme**: `http`
5. **Forward Hostname / IP**: Masukkan `pangan_frontend` *(ini adalah nama containernya)*
6. **Forward Port**: `8002` *(port milik frontend)*
7. Centang **Block Common Exploits**.
8. Pindah ke tab **SSL**, klik "Request a new SSL Certificate" untuk mengaktifkan HTTPS.
9. Klik **Save**.

(Lakukan hal yang sama untuk Backend jika Anda membuat subdomain khusus backend seperti `api.pangankreatif.my.id` dan arahkan ke hostname `pangan_backend` port `8003`).

Selesai! Sistem CI/CD sudah hidup. Setiap kali kawan Anda nge-push kode ke GitHub, VPS akan otomatis ter-update!
