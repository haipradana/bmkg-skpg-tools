# SKPG Tools DIY

Aplikasi web untuk input indikator anomali iklim dan export ke Excel sesuai template SKPG.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- ExcelJS (export Excel)
- Leaflet (peta)
- Turf.js (analisis GIS/spasial)

## Quick Start

```bash
# Install
bun install

# Development
bun run dev

# Build
bun run build
```

## Fitur Utama

1. **Wizard Kabupaten** - Input data 5 kabupaten DIY
2. **Wizard Kecamatan** - Input data 78 kecamatan DIY
3. **Upload CSV/XLSX** - HTH, CH/SH bulanan, dasarian, prediksi
4. **Export Excel** - 3 sheet: Data SKPG, Ringkasan, Keterangan

## Struktur File Penting

```
src/
├── store/
│   ├── wizardStore.ts      # Data kabupaten
│   └── kecamatanStore.ts   # Data kecamatan + daftar wilayah
├── utils/
│   ├── excelExport.ts      # Export kabupaten
│   └── excelExportKec.ts   # Export kecamatan
└── public/
    ├── kab_kota.geojson    # Batas kabupaten
    └── batas_kec.geojson   # Batas kecamatan
```

---

## Adaptasi untuk Daerah Lain

Jika ingin menggunakan aplikasi ini untuk provinsi/daerah lain, berikut yang perlu diubah:

### 1. Data Wilayah (`src/store/`)

**wizardStore.ts** - Ganti daftar kabupaten:
```typescript
export const KABUPATEN_LIST = [
  'Kabupaten A',
  'Kabupaten B',
  // dst...
];
```

**kecamatanStore.ts** - Ganti daftar kecamatan per kabupaten:
```typescript
export const KECAMATAN_BY_KABUPATEN = {
  'Kabupaten A': ['Kec 1', 'Kec 2', ...],
  'Kabupaten B': ['Kec 3', 'Kec 4', ...],
};
```

### 2. File GeoJSON (`public/`)

- **kab_kota.geojson** - Ganti dengan batas kabupaten daerah Anda
  - Property yang dibutuhkan: `NAMOBJ` (nama kabupaten)
- **batas_kec.geojson** - Ganti dengan batas kecamatan daerah Anda
  - Property yang dibutuhkan: `NAMOBJ` (nama kecamatan)

### 3. Bounding Box (`src/utils/csvUtils.ts`)

Sesuaikan batas koordinat untuk filter data:
```typescript
const DIY_BBOX = {
  minLat: -8.2,  // Sesuaikan
  maxLat: -7.5,  // Sesuaikan
  minLon: 110.0, // Sesuaikan
  maxLon: 110.9  // Sesuaikan
};
```

### 4. Label & Teks

- **Landing.tsx** - Ganti judul dan deskripsi
- **excelExport.ts / excelExportKec.ts** - Ganti:
  - Judul sheet
  - Nama file output (misal: `SKPG_JATENG_...`)
  - Kolom "Prov" (sekarang "DIY")

### 5. Logo (opsional)

- Ganti `public/Logo_BMKG.png` dengan logo yang sesuai

---

## Kontak

BMKG Stasiun Klimatologi D.I. Yogyakarta
