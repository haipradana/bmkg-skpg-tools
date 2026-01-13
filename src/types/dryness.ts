// Tipe data untuk Analisis Indikator Kekeringan BMKG

export interface PointData {
  LAT: number;
  LONG: number;
  CH: number;
  SH: number;
}

export interface RegencyResult {
  prov: string;
  kab: string;
  n_total: number;
  n_ch_rendah: number;
  pct_ch_rendah: number;
  ach_rendah: number;
  n_ch_tinggi: number;
  pct_ch_tinggi: number;
  ach_tinggi: number;
  n_sh_bn: number;
  pct_sh_bn: number;
  ash_bn: number;
  n_sh_an: number;
  pct_sh_an: number;
  ash_an: number;
  avg_ch: number;  // Rata-rata CH untuk visualisasi
  avg_sh: number;  // Rata-rata SH untuk visualisasi
}

export interface GeoJSONFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoJSONCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export type MetricType = "ach" | "ash";

// Mode 2: Separate CH and SH files
export interface CHPointData {
  LAT: number;
  LON: number;
  CH: number;
  NOGRID?: string;
}

export interface SHPointData {
  LAT: number;
  LON: number;
  SH: number;
  NOGRID?: string;
}

export type MatchingMethod = "coordinates" | "nogrid";

export interface ProcessingProgress {
  step: string;
  current: number;
  total: number;
  message: string;
}
