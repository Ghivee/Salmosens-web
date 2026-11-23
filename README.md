# Salmosens

Salmosens is a web dashboard for Salmonella test results, built for a sensor device (also called Salmosens) that detects Salmonella contamination in food. Food safety testing is only useful if the results end up somewhere people can act on them: this dashboard is where a single test reading becomes a record that is searchable, mappable, and part of a wider picture of where contamination is showing up.

[Baca dalam Bahasa Indonesia di bawah](#bahasa-indonesia)

## What it does

- **Test results**: each record captures the sample type (chicken, egg, raw milk or beef), a CFU (colony-forming unit) value, a positive or negative result, GPS coordinates and a human-readable location name, the testing device's battery level at the time, and which device variant (`HOME` or `PRO`) produced it, since the two are calibrated differently.
- **User roles**: `GOVERNMENT` (regulators who need the full picture across testers), `PRO` (professional testers, likely running many tests), and `HOME` (a household device user running occasional tests), each of which could reasonably see a different slice of the data.
- **Alerts and statistics**, surfaced through dedicated API routes: `/api/alerts` for results that need attention, `/api/stats` for aggregate numbers, `/api/tests` for the underlying records, and `/api/report` for generating a report from them.

## Tech stack

Next.js, TypeScript, Tailwind CSS, shadcn/ui, Prisma with SQLite (`db/custom.db`) as the database, deployed on Vercel.

## Getting started

```bash
npm install
cp .env.example .env   # DATABASE_URL, pointing at the SQLite file
npm run db:push        # create the tables from prisma/schema.prisma
npx tsx prisma/seed.ts # optional: load sample data to look at before any real test exists
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build`, `npm start` | Production build and server |
| `npm run db:push`, `db:migrate`, `db:reset` | Prisma schema commands: push the schema directly, run a migration, or reset the database |
| `npm run lint` | ESLint |

## Project structure

```
src/app/        the page and its API routes (alerts, report, stats, tests)
src/components/ dashboard components, built on shadcn/ui
prisma/         the Prisma schema and seed script
db/             the SQLite database file
```

---

## Bahasa Indonesia

Salmosens adalah dashboard web untuk hasil uji Salmonella, dibuat untuk perangkat sensor (juga bernama Salmosens) yang mendeteksi kontaminasi Salmonella pada makanan. Pengujian keamanan pangan baru berguna kalau hasilnya berakhir di tempat yang bisa ditindaklanjuti orang: dashboard ini adalah tempat satu pembacaan uji menjadi sebuah catatan yang bisa dicari, dipetakan, dan menjadi bagian dari gambaran yang lebih luas tentang di mana kontaminasi muncul.

### Fungsi

- **Hasil uji**: setiap catatan merekam jenis sampel (ayam, telur, susu mentah, atau daging sapi), nilai CFU (colony-forming unit), hasil positif atau negatif, koordinat GPS dan nama lokasi yang mudah dibaca, level baterai alat uji saat itu, dan varian alat mana (`HOME` atau `PRO`) yang menghasilkannya, karena keduanya dikalibrasi secara berbeda.
- **Peran pengguna**: `GOVERNMENT` (regulator yang butuh gambaran lengkap lintas penguji), `PRO` (penguji profesional, kemungkinan menjalankan banyak uji), dan `HOME` (pengguna alat rumah tangga yang menjalankan uji sesekali), yang masing-masing wajar melihat potongan data yang berbeda.
- **Peringatan dan statistik**, ditampilkan lewat rute API khusus: `/api/alerts` untuk hasil yang perlu perhatian, `/api/stats` untuk angka agregat, `/api/tests` untuk catatan mentahnya, dan `/api/report` untuk membuat laporan darinya.

### Teknologi

Next.js, TypeScript, Tailwind CSS, shadcn/ui, Prisma dengan SQLite (`db/custom.db`) sebagai database, dideploy di Vercel.

### Menjalankan

```bash
npm install
cp .env.example .env   # DATABASE_URL, menunjuk ke berkas SQLite
npm run db:push        # buat tabel dari prisma/schema.prisma
npx tsx prisma/seed.ts # opsional: muat data contoh untuk dilihat sebelum ada uji sungguhan
npm run dev
```

| Skrip | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build`, `npm start` | Build produksi dan server |
| `npm run db:push`, `db:migrate`, `db:reset` | Perintah skema Prisma: push skema langsung, jalankan migrasi, atau reset database |
| `npm run lint` | ESLint |

### Struktur

```
src/app/        halaman dan rute API-nya (alerts, report, stats, tests)
src/components/ komponen dashboard, dibangun di atas shadcn/ui
prisma/         skema Prisma dan skrip seed
db/             berkas database SQLite
```
