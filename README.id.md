# Salmosens

Dashboard web untuk hasil uji Salmonella. Setiap uji mencatat jenis sampel (ayam, telur, susu mentah, atau daging sapi), nilai CFU, hasil positif atau negatif, lokasi, dan level baterai alat uji. Dashboard menampilkan statistik, daftar hasil, peringatan, dan endpoint laporan.

[English](README.md)

## Fungsi

- Hasil uji dengan jenis sampel, nilai CFU, hasil, koordinat, nama lokasi, baterai alat, dan varian alat (`HOME` atau `PRO`).
- Peran pengguna `GOVERNMENT`, `PRO`, dan `HOME`.
- Peringatan dan statistik lewat rute API `/api/alerts`, `/api/stats`, `/api/tests`, dan `/api/report`.

## Teknologi

Next.js, TypeScript, Tailwind CSS, shadcn/ui, Prisma dengan SQLite (`db/custom.db`), dideploy di Vercel.

## Menjalankan

```bash
npm install
cp .env.example .env
npm run db:push        # buat tabel dari prisma/schema.prisma
npx tsx prisma/seed.ts # data contoh (opsional)
npm run dev
```

| Skrip | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build`, `npm start` | Build produksi dan server |
| `npm run db:push`, `db:migrate`, `db:reset` | Perintah skema Prisma |
| `npm run lint` | ESLint |

## Struktur

```
src/app/        halaman dan rute API (alerts, report, stats, tests)
src/components/ komponen dashboard dan shadcn/ui
prisma/         skema dan seed
db/             berkas database SQLite
```
