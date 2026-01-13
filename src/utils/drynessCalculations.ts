import * as turf from "@turf/turf";
import type { PointData, RegencyResult, GeoJSONFeature, GeoJSONCollection } from "@/types/dryness";

/**
 * Parse data CSV menjadi array PointData
 * Melewati baris dengan nilai LAT, LONG, CH, atau SH yang tidak valid/kosong
 */
export function parseCSVToPoints(data: Record<string, string>[]): PointData[] {
  const points: PointData[] = [];

  for (const row of data) {
    const lat = parseFloat(row.LAT);

    // Try LONG first, if invalid/empty try LON
    let long = parseFloat(row.LONG);
    if (isNaN(long)) {
      long = parseFloat(row.LON);
    }

    const ch = parseFloat(row.CH);
    const sh = parseFloat(row.SH);

    // Skip rows with invalid/missing data
    if (isNaN(lat) || isNaN(long) || isNaN(ch) || isNaN(sh)) {
      continue;
    }

    points.push({ LAT: lat, LONG: long, CH: ch, SH: sh });
  }

  return points;
}

/**
 * Mengecek apakah sebuah titik berada di dalam poligon menggunakan Turf.js
 */
function isPointInPolygon(point: PointData, feature: GeoJSONFeature): boolean {
  const pt = turf.point([point.LONG, point.LAT]);

  try {
    // Handle both Polygon and MultiPolygon geometries
    if (feature.geometry.type === "Polygon") {
      const poly = turf.polygon(feature.geometry.coordinates as number[][][]);
      return turf.booleanPointInPolygon(pt, poly);
    } else if (feature.geometry.type === "MultiPolygon") {
      const multiPoly = turf.multiPolygon(feature.geometry.coordinates as number[][][][]);
      return turf.booleanPointInPolygon(pt, multiPoly);
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Filter titik-titik yang berada dalam batas wilayah GeoJSON
 * Berguna untuk memfilter data seluruh Indonesia menjadi hanya DIY
 */
export function filterPointsInRegion(
  points: PointData[],
  geojson: GeoJSONCollection
): PointData[] {
  const filteredPoints: PointData[] = [];

  // Buat bounding box untuk pre-filtering (lebih cepat)
  const allCoords: number[][] = [];
  for (const feature of geojson.features) {
    if (feature.geometry.type === "Polygon") {
      const coords = feature.geometry.coordinates[0] as number[][];
      allCoords.push(...coords);
    } else if (feature.geometry.type === "MultiPolygon") {
      for (const polygon of feature.geometry.coordinates) {
        const coords = polygon[0] as number[][];
        allCoords.push(...coords);
      }
    }
  }

  const bbox = turf.bbox(turf.multiPoint(allCoords));
  const [minLon, minLat, maxLon, maxLat] = bbox;

  // Pre-filter dengan bounding box (sangat cepat)
  const pointsInBBox = points.filter(
    (p) => p.LONG >= minLon && p.LONG <= maxLon && p.LAT >= minLat && p.LAT <= maxLat
  );



  // Detailed check dengan point-in-polygon
  for (const point of pointsInBBox) {
    for (const feature of geojson.features) {
      if (isPointInPolygon(point, feature)) {
        filteredPoints.push(point);
        break; // Point sudah ketemu dalam salah satu feature, skip ke point berikutnya
      }
    }
  }



  return filteredPoints;
}

/**
 * Menghitung indikator kekeringan untuk setiap kabupaten/kota
 */
export function calculateDrynessIndicators(
  points: PointData[],
  geojson: GeoJSONCollection,
  nameField: string
): RegencyResult[] {
  const results: RegencyResult[] = [];

  for (const feature of geojson.features) {
    const kabName = String(feature.properties[nameField] || "Unknown");

    // Mencari semua titik yang berada di dalam kabupaten/kota ini
    const pointsInRegency = points.filter((point) => isPointInPolygon(point, feature));

    const n_total = pointsInRegency.length;

    if (n_total === 0) {
      // Tidak ada titik di kabupaten/kota ini
      results.push({
        prov: "DIY",
        kab: kabName,
        n_total: 0,
        n_ch_rendah: 0,
        pct_ch_rendah: 0,
        ach_rendah: 0,
        n_ch_tinggi: 0,
        pct_ch_tinggi: 0,
        ach_tinggi: 0,
        n_sh_bn: 0,
        pct_sh_bn: 0,
        ash_bn: 0,
        n_sh_an: 0,
        pct_sh_an: 0,
        ash_an: 0,
        avg_ch: 0,
        avg_sh: 0,
      });
      continue;
    }

    // Menghitung indikator CH Rendah (Curah Hujan < 100mm)
    const n_ch_rendah = pointsInRegency.filter((p) => p.CH < 100).length;
    const pct_ch_rendah = (n_ch_rendah / n_total) * 100;
    const ach_rendah = pct_ch_rendah > 10 ? 1 : 0;

    // Menghitung indikator CH Tinggi (Curah Hujan > 301mm = Tinggi/Sangat Tinggi)
    const n_ch_tinggi = pointsInRegency.filter((p) => p.CH > 301).length;
    const pct_ch_tinggi = (n_ch_tinggi / n_total) * 100;
    const ach_tinggi = pct_ch_tinggi > 10 ? 1 : 0;

    // Menghitung indikator SH Bawah Normal (Sifat Hujan < 84% = Bawah Normal)
    const n_sh_bn = pointsInRegency.filter((p) => p.SH < 84).length;
    const pct_sh_bn = (n_sh_bn / n_total) * 100;
    const ash_bn = pct_sh_bn > 10 ? 1 : 0;

    // Menghitung indikator SH Atas Normal (Sifat Hujan > 116% = Atas Normal)
    const n_sh_an = pointsInRegency.filter((p) => p.SH > 116).length;
    const pct_sh_an = (n_sh_an / n_total) * 100;
    const ash_an = pct_sh_an > 10 ? 1 : 0;

    // Menghitung rata-rata CH dan SH untuk visualisasi peta
    const avg_ch = pointsInRegency.reduce((sum, p) => sum + p.CH, 0) / n_total;
    const avg_sh = pointsInRegency.reduce((sum, p) => sum + p.SH, 0) / n_total;

    results.push({
      prov: "DIY",
      kab: kabName,
      n_total,
      n_ch_rendah,
      pct_ch_rendah,
      ach_rendah,
      n_ch_tinggi,
      pct_ch_tinggi,
      ach_tinggi,
      n_sh_bn,
      pct_sh_bn,
      ash_bn,
      n_sh_an,
      pct_sh_an,
      ash_an,
      avg_ch,
      avg_sh,
    });
  }

  return results;
}

/**
 * Mengonversi hasil ke string CSV untuk diunduh
 */
export function resultsToCSV(results: RegencyResult[], period: string): string {
  const header = [
    "PROV",
    "KAB",
    "n_total",
    `pct_ch_rendah`,
    `ach_${period}_rendah`,
    `pct_ch_tinggi`,
    `ach_${period}_tinggi`,
    `pct_sh_bn`,
    `ash_${period}_BN`,
    `pct_sh_an`,
    `ash_${period}_AN`,
  ].join(",");

  const rows = results.map((r) =>
    [
      r.prov,
      `"${r.kab}"`,
      r.n_total,
      r.pct_ch_rendah.toFixed(2),
      r.ach_rendah,
      r.pct_ch_tinggi.toFixed(2),
      r.ach_tinggi,
      r.pct_sh_bn.toFixed(2),
      r.ash_bn,
      r.pct_sh_an.toFixed(2),
      r.ash_an,
    ].join(",")
  );

  return [header, ...rows].join("\n");
}

/**
 * Mendapatkan daftar property keys yang tersedia dari fitur GeoJSON
 */
export function getGeoJSONPropertyKeys(geojson: GeoJSONCollection): string[] {
  if (!geojson.features || geojson.features.length === 0) {
    return [];
  }

  const firstFeature = geojson.features[0];
  return Object.keys(firstFeature.properties || {});
}
