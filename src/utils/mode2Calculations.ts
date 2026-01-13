import * as turf from "@turf/turf";
import type {
  CHPointData,
  SHPointData,
  PointData,
  GeoJSONCollection,
  GeoJSONFeature,
  RegencyResult,
  MatchingMethod,
  ProcessingProgress,
} from "@/types/dryness";

// Export grid interpolation functions
export { generateInterpolatedGrid, getGridInfo, GRID_RESOLUTION } from "./gridInterpolation";

/**
 * Parse CSV data menjadi CHPointData
 */
export function parseCSVToCHPoints(data: Record<string, string>[]): CHPointData[] {
  const points: CHPointData[] = [];

  for (const row of data) {
    const lat = parseFloat(row.LAT);
    const lon = parseFloat(row.LON);
    const ch = parseFloat(row.CH || row.VAL); // VAL bisa jadi CH

    // Skip rows with invalid/missing data
    if (isNaN(lat) || isNaN(lon) || isNaN(ch)) {
      continue;
    }

    const point: CHPointData = { LAT: lat, LON: lon, CH: ch };
    if (row.NOGRID) {
      point.NOGRID = row.NOGRID;
    }

    points.push(point);
  }

  return points;
}

/**
 * Parse CSV data menjadi SHPointData
 */
export function parseCSVToSHPoints(data: Record<string, string>[]): SHPointData[] {
  const points: SHPointData[] = [];

  for (const row of data) {
    const lat = parseFloat(row.LAT);
    const lon = parseFloat(row.LON);
    const sh = parseFloat(row.SH || row.VAL); // VAL bisa jadi SH

    // Skip rows with invalid/missing data
    if (isNaN(lat) || isNaN(lon) || isNaN(sh)) {
      continue;
    }

    const point: SHPointData = { LAT: lat, LON: lon, SH: sh };
    if (row.NOGRID) {
      point.NOGRID = row.NOGRID;
    }

    points.push(point);
  }

  return points;
}

/**
 * Filter titik-titik yang berada dalam batas DIY
 */
export function filterPointsInDIY<T extends { LAT: number; LON: number }>(
  points: T[],
  geojson: GeoJSONCollection,
  onProgress?: (progress: ProcessingProgress) => void
): T[] {
  const filteredPoints: T[] = [];
  const total = points.length;

  // Buat bounding box dari semua features DIY untuk pre-filtering
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
    (p) => p.LON >= minLon && p.LON <= maxLon && p.LAT >= minLat && p.LAT <= maxLat
  );

  onProgress?.({
    step: "filter",
    current: pointsInBBox.length,
    total: total,
    message: `Pre-filtering: ${pointsInBBox.length} dari ${total} titik dalam bounding box DIY`,
  });

  // Detailed check dengan point-in-polygon (lebih lambat)
  for (let i = 0; i < pointsInBBox.length; i++) {
    const point = pointsInBBox[i];
    const pt = turf.point([point.LON, point.LAT]);

    for (const feature of geojson.features) {
      try {
        let isInside = false;

        if (feature.geometry.type === "Polygon") {
          const poly = turf.polygon(feature.geometry.coordinates as number[][][]);
          isInside = turf.booleanPointInPolygon(pt, poly);
        } else if (feature.geometry.type === "MultiPolygon") {
          const multiPoly = turf.multiPolygon(feature.geometry.coordinates as number[][][][]);
          isInside = turf.booleanPointInPolygon(pt, multiPoly);
        }

        if (isInside) {
          filteredPoints.push(point);
          break;
        }
      } catch {
        continue;
      }
    }

    // Update progress every 100 points
    if (i % 100 === 0 || i === pointsInBBox.length - 1) {
      onProgress?.({
        step: "filter",
        current: i + 1,
        total: pointsInBBox.length,
        message: `Memfilter titik dalam polygon DIY: ${filteredPoints.length} titik ditemukan`,
      });
    }
  }

  return filteredPoints;
}

/**
 * Match CH dan SH data berdasarkan metode yang dipilih
 */
export function matchCHAndSH(
  chPoints: CHPointData[],
  shPoints: SHPointData[],
  method: MatchingMethod,
  onProgress?: (progress: ProcessingProgress) => void
): PointData[] {
  const matchedPoints: PointData[] = [];

  if (method === "nogrid") {
    // Match by NOGRID
    const shMap = new Map<string, SHPointData>();
    for (const sh of shPoints) {
      if (sh.NOGRID) {
        shMap.set(sh.NOGRID, sh);
      }
    }

    for (let i = 0; i < chPoints.length; i++) {
      const ch = chPoints[i];
      if (ch.NOGRID && shMap.has(ch.NOGRID)) {
        const sh = shMap.get(ch.NOGRID)!;
        matchedPoints.push({
          LAT: ch.LAT,
          LONG: ch.LON,
          CH: ch.CH,
          SH: sh.SH,
        });
      }

      // Update progress every 500 points
      if (i % 500 === 0 || i === chPoints.length - 1) {
        onProgress?.({
          step: "match",
          current: i + 1,
          total: chPoints.length,
          message: `Matching by NOGRID: ${matchedPoints.length} pasangan ditemukan`,
        });
      }
    }
  } else {
    // Match by coordinates
    // Buat tolerance untuk coordinate matching (0.001 derajat ~ 100m)
    const TOLERANCE = 0.001;

    for (let i = 0; i < chPoints.length; i++) {
      const ch = chPoints[i];

      // Cari SH dengan koordinat yang sama (dengan tolerance)
      const sh = shPoints.find(
        (s) =>
          Math.abs(s.LAT - ch.LAT) < TOLERANCE &&
          Math.abs(s.LON - ch.LON) < TOLERANCE
      );

      if (sh) {
        matchedPoints.push({
          LAT: ch.LAT,
          LONG: ch.LON,
          CH: ch.CH,
          SH: sh.SH,
        });
      }

      // Update progress every 500 points
      if (i % 500 === 0 || i === chPoints.length - 1) {
        onProgress?.({
          step: "match",
          current: i + 1,
          total: chPoints.length,
          message: `Matching by coordinates: ${matchedPoints.length} pasangan ditemukan`,
        });
      }
    }
  }

  return matchedPoints;
}

/**
 * Mengecek apakah sebuah titik berada di dalam poligon
 */
function isPointInPolygon(point: PointData, feature: GeoJSONFeature): boolean {
  const pt = turf.point([point.LONG, point.LAT]);

  try {
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
 * Menghitung indikator kekeringan dengan progress tracking
 */
export async function calculateDrynessIndicatorsWithProgress(
  points: PointData[],
  geojson: GeoJSONCollection,
  nameField: string,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<RegencyResult[]> {
  const results: RegencyResult[] = [];
  const totalFeatures = geojson.features.length;

  for (let idx = 0; idx < geojson.features.length; idx++) {
    const feature = geojson.features[idx];
    const kabName = String(feature.properties[nameField] || "Unknown");

    onProgress?.({
      step: "calculate",
      current: idx + 1,
      total: totalFeatures,
      message: `Menghitung ${kabName}...`,
    });

    // Mencari semua titik yang berada di dalam kabupaten/kota ini
    const pointsInRegency = points.filter((point) => isPointInPolygon(point, feature));

    const n_total = pointsInRegency.length;

    if (n_total === 0) {
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

    // Menghitung indikator CH Tinggi (Curah Hujan > 301mm)
    const n_ch_tinggi = pointsInRegency.filter((p) => p.CH > 301).length;
    const pct_ch_tinggi = (n_ch_tinggi / n_total) * 100;
    const ach_tinggi = pct_ch_tinggi > 10 ? 1 : 0;

    // Menghitung indikator SH Bawah Normal (Sifat Hujan < 84%)
    const n_sh_bn = pointsInRegency.filter((p) => p.SH < 84).length;
    const pct_sh_bn = (n_sh_bn / n_total) * 100;
    const ash_bn = pct_sh_bn > 10 ? 1 : 0;

    // Menghitung indikator SH Atas Normal (Sifat Hujan > 116%)
    const n_sh_an = pointsInRegency.filter((p) => p.SH > 116).length;
    const pct_sh_an = (n_sh_an / n_total) * 100;
    const ash_an = pct_sh_an > 10 ? 1 : 0;

    // Menghitung rata-rata CH dan SH
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

    // Yield to browser to prevent freezing
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return results;
}
