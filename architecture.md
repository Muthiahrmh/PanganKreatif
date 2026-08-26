# Arsitektur & Deployment Web Pangan Kreatif

Dokumen ini merangkum seluruh infrastruktur, konfigurasi, dan alur _deployment_ untuk aplikasi **Pangan Kreatif** yang telah berhasil dijalankan secara _live_.

---

## 1. Topologi & Alur Sistem (Architecture)

```mermaid
flowchart TD
    User([Pengguna / Browser]) --> |HTTPS| DNS[DNS (Rumahweb)]
    DNS --> |A Record: 202.155.17.4| VPS[VPS CentOS / Ubuntu]
    
    subgraph VPS [VPS Server - /opt/project_kawan]
        NPM[Nginx Proxy Manager]
        
        subgraph Docker Network [proxy_default]
            Frontend[pangan_frontend:8002]
            Backend[pangan_backend:8003]
        end
        
        NPM -->|pangankreatif.my.id| Frontend
        NPM -->|api.pangankreatif.my.id| Backend
    end
    
    Backend --> |PostgreSQL Connection| DB[(Supabase DB)]
    Frontend --> |Fetch API| Backend
```

## 2. Server & Environment
- **VPS IP Address**: `202.155.17.4`
- **Work Directory (VPS)**: `/opt/project_kawan/`
- **Database**: PostgreSQL Hosted via **Supabase**
- **Domain/DNS**: Diatur di Rumahweb, dengan record mengarah ke IP VPS.

## 3. Komponen Aplikasi

### A. Frontend (Next.js)
- **Direktori Kode**: `frontend/`
- **Domain**: `https://pangankreatif.my.id`
- **Port Internal Docker**: `8002` (via file `docker-compose.yml`)
- **Environment Variable**: `NEXT_PUBLIC_API_URL=https://api.pangankreatif.my.id` (Diatur pada `docker-compose.yml` agar Next.js dapat berkomunikasi dengan backend di VPS).

### B. Backend (Node.js + Express + Prisma)
- **Direktori Kode**: `backend/`
- **Domain**: `https://api.pangankreatif.my.id`
- **Port Internal Docker**: `8003` (Di-override via file `.env` di dalam VPS)
- **Base Image Docker**: `node:20-slim` (Penting: menggunakan OS Debian-based yang di-install `openssl` untuk mencegah error *crash* pada *engine* Prisma yang tidak kompatibel dengan Alpine Linux).

## 4. CI/CD Pipeline (GitHub Actions)

Proses perilisan (deployment) sepenuhnya terotomatisasi. Jika ada perubahan kode di komputer lokal, developer hanya perlu:
1. `git add .`
2. `git commit -m "Pesan perubahan"`
3. `git push`

Secara otomatis, GitHub Actions (diatur dalam `.github/workflows/deploy.yml`) akan:
- Mem-build ulang image Docker untuk *Frontend* dan *Backend*.
- Mem-push hasilnya ke **GitHub Container Registry (GHCR)** di `ghcr.io/muthiahrmh/pangan-frontend:latest` dan `pangan-backend:latest`.

## 5. Konfigurasi VPS & Docker Compose

File utama untuk menjalankan container di VPS berada di `/opt/project_kawan/`.

**A. File `docker-compose.yml`**
```yaml
version: '3.8'

services:
  pangan_backend:
    image: ghcr.io/muthiahrmh/pangan-backend:latest
    container_name: pangan_backend
    restart: always
    env_file:             
      - .env              
    networks:
      - proxy_default

  pangan_frontend:
    image: ghcr.io/muthiahrmh/pangan-frontend:latest
    container_name: pangan_frontend
    restart: always
    environment:
      - NEXT_PUBLIC_API_URL=https://api.pangankreatif.my.id 
    networks:
      - proxy_default

networks:
  proxy_default:
    external: true
```

**B. File `.env` (Hanya ada di VPS demi keamanan)**
Berisi 35 variabel lingkungan krusial yang diperlukan Backend untuk menyala. Beberapa yang paling penting meliputi:
- `PORT=8003` (Mengatur port Express.js)
- `DATABASE_URL` (Koneksi ke Supabase)
- `JWT_SECRET`
- `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`
- `MIDTRANS_SERVER_KEY` & `MIDTRANS_CLIENT_KEY`

## 6. Nginx Proxy Manager (Routing & SSL)

Nginx Proxy Manager mengelola *traffic* masuk dan menyediakan Sertifikat SSL dari Let's Encrypt secara otomatis.

1. **Proxy Host 1 (Frontend)**
   - Domain Names: `pangankreatif.my.id`, `www.pangankreatif.my.id`
   - Forward Hostname: `pangan_frontend`
   - Forward Port: `8002`
   - Force SSL: Aktif

2. **Proxy Host 2 (Backend / API)**
   - Domain Names: `api.pangankreatif.my.id`
   - Forward Hostname: `pangan_backend`
   - Forward Port: `8003`
   - Force SSL: Aktif

## 7. Prosedur Maintenance Manual (Update di VPS)

push ke github, setelah action selesai batu lakukan yang dibawah ini
Jika Pipeline GitHub Actions sudah berhasil mem-build image baru, lakukan update di VPS dengan perintah berikut di dalam direktori `/opt/project_kawan/`:

```bash
docker-compose pull
docker-compose up -d --force-recreate
```
Ini akan mengunduh image terbaru dari GitHub dan merestart aplikasi tanpa mematikan Nginx.
