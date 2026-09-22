# Ruang — Sistem Reservasi & Pelaporan Fasilitas Kampus

Sistem manajemen reservasi dan pelaporan kerusakan fasilitas kampus berbasis web.

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL · Prisma · Auth.js v5

---

## Menjalankan Environment Dev

### Prasyarat
- [Node.js](https://nodejs.org) >= 20
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose

### Langkah-langkah

**1. Clone & masuk ke direktori proyek**
```bash
git clone <repo-url>
cd Ruang
```

**2. Salin file environment**
```bash
cp .env.example .env
# Edit .env jika perlu (nilai default sudah sesuai untuk dev lokal)
```

**3. Jalankan database PostgreSQL**
```bash
# Jika menggunakan Docker Compose v2 (plugin):
docker compose up -d

# Jika menggunakan Docker Compose v1 (standalone):
docker-compose up -d
```

Verifikasi container berjalan:
```bash
docker compose ps
# atau: docker-compose ps
```

**4. Install dependencies**
```bash
npm install
```

**5. Jalankan migration database**
> Pastikan container PostgreSQL sudah berjalan (langkah 3) sebelum menjalankan ini.

```bash
npx prisma migrate dev
```

**6. Jalankan development server**
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## Database & Prisma

| Perintah | Keterangan |
|---|---|
| `npx prisma migrate dev` | Buat & terapkan migration baru |
| `npx prisma migrate status` | Cek status migration |
| `npx prisma studio` | Buka GUI untuk melihat/edit data |
| `npx prisma validate` | Validasi schema.prisma |
| `npx prisma generate` | Generate ulang Prisma Client |

### Struktur Folder

```
src/
├── app/                  # Next.js App Router (halaman & route)
│   └── api/auth/         # Route handler Auth.js
├── components/           # Komponen React (diisi di fase UI)
├── server/               # Kode server-side only
│   ├── db.ts             # Prisma Client singleton
│   ├── auth.ts           # Konfigurasi Auth.js
│   └── services/         # Business logic services (diisi di fase berikutnya)
└── lib/                  # Utilities & skema validasi (diisi di fase berikutnya)
prisma/
├── schema.prisma         # Definisi model & enum database
└── migrations/           # File migration yang di-generate Prisma
prisma.config.ts          # Konfigurasi Prisma v7 (datasource URL)
docker-compose.yml        # Definisi service PostgreSQL
```

---

## Autentikasi

Proyek menggunakan **Auth.js v5** (`next-auth@beta`) dengan:
- **Provider**: Credentials (email + password)
- **Session strategy**: JWT
- Implementasi penuh (`authorize()`, validasi password, dsb.) dilakukan di fase Auth.

---

## Catatan Tim

- **Jangan commit `.env`** — file ini ada di `.gitignore`. Gunakan `.env.example` sebagai template.
- **Jalankan `npx prisma generate`** setelah `npm install` (otomatis via `postinstall` script).
- **Prisma v7** menggunakan `prisma.config.ts` untuk konfigurasi datasource, bukan `url` di `schema.prisma`.
