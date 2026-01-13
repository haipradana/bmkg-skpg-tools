import * as turf from "@turf/turf";
import type { CHPointData, SHPointData, PointData, GeoJSONCollection } from "@/types/dryness";

/**
 * Konstanta untuk grid resolution (dalam derajat)
 */
export const PARENT_GRID_RESOLUTION = 0.05; // 0.05° × 0.05° (parent grid dari data asli)
export const TARGET_GRID_RESOLUTION = 0.01; // 0.01° × 0.01° (target output grid)
export const GRID_RESOLUTION = TARGET_GRID_RESOLUTION; // Export untuk backward compatibility

/**
 * Interface untuk grid point
 */
export interface GridPoint {
  LAT: number;
  LON: number;
}

/**
 * Mendapatkan bounding box dari GeoJSON dengan padding
 */
export function getGeoJSONBoundingBox(geojson: GeoJSONCollection, padding = 0.05): [number, number, number, number] {
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

  // Add padding
  return [
    minLon - padding,
    minLat - padding,
    maxLon + padding,
    maxLat + padding
  ];
}

/**
 * Generate grid points dalam bounding box dengan resolusi tertentu
 */
export function generateGridPoints(
  bbox: [number, number, number, number],
  resolution: number = GRID_RESOLUTION
): GridPoint[] {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const gridPoints: GridPoint[] = [];

  // Generate grid
  let lat = minLat;
  while (lat <= maxLat) {
    let lon = minLon;
    while (lon <= maxLon) {
      gridPoints.push({ LAT: lat, LON: lon });
      lon += resolution;
    }
    lat += resolution;
  }

  return gridPoints;
}

/**
 * Filter grid points yang berada dalam polygon DIY
 */
export function filterGridPointsInPolygon(
  gridPoints: GridPoint[],
  geojson: GeoJSONCollection
): GridPoint[] {
  const filteredPoints: GridPoint[] = [];

  for (const point of gridPoints) {
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
  }

  return filteredPoints;
}

/**
 * Cari parent grid cell yang mengandung target point
 * Menggunakan floor untuk mendapatkan grid cell bawah kiri
 */
function findParentGridCell(
  targetPoint: GridPoint,
  parentGridResolution: number = PARENT_GRID_RESOLUTION
): GridPoint {
  // Floor untuk mendapatkan corner bawah kiri dari grid cell yang mengandung point ini
  const parentLat = Math.floor(targetPoint.LAT / parentGridResolution) * parentGridResolution;
  const parentLon = Math.floor(targetPoint.LON / parentGridResolution) * parentGridResolution;

  return {
    LAT: Number(parentLat.toFixed(6)),
    LON: Number(parentLon.toFixed(6))
  };
}

/**
 * Cari nilai dari parent grid cell
 * Mencari data point yang berada di parent grid cell tersebut
 */
function getValueFromParentCell(
  parentCell: GridPoint,
  dataPoints: CHPointData[] | SHPointData[],
  valueKey: 'CH' | 'SH',
  parentGridResolution: number = PARENT_GRID_RESOLUTION
): number | null {
  // Buat spatial index sederhana untuk lookup cepat
  const cellKey = `${parentCell.LAT.toFixed(4)},${parentCell.LON.toFixed(4)}`;

  // Cari data point dalam parent cell ini (dengan sedikit toleransi untuk floating point)
  const tolerance = 0.001; // 0.001° toleransi untuk floating point

  for (const point of dataPoints) {
    // Check apakah point ini berada dalam parent cell
    if (point.LAT >= parentCell.LAT - tolerance &&
      point.LAT < parentCell.LAT + parentGridResolution + tolerance &&
      point.LON >= parentCell.LON - tolerance &&
      point.LON < parentCell.LON + parentGridResolution + tolerance) {
      return (point as any)[valueKey];
    }
  }

  // Kalau tidak ada exact match di cell, cari yang terdekat (fallback)
  let closestPoint: (CHPointData | SHPointData) | null = null;
  let minDistance = Infinity;

  const centerLat = parentCell.LAT + parentGridResolution / 2;
  const centerLon = parentCell.LON + parentGridResolution / 2;

  for (const point of dataPoints) {
    const dLat = point.LAT - centerLat;
    const dLon = point.LON - centerLon;
    const distance = Math.sqrt(dLat * dLat + dLon * dLon);

    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
    }
  }

  return closestPoint ? (closestPoint as any)[valueKey] : null;
}

/**
 * Generate grid dengan metode Block Fill/Replication
 * Setiap grid 0.05° dipecah menjadi 5×5 = 25 sub-grid 0.01° dengan nilai yang sama
 */
export function generateInterpolatedGrid(
  chPoints: CHPointData[],
  shPoints: SHPointData[],
  geojson: GeoJSONCollection,
  onProgress?: (current: number, total: number, message: string) => void
): PointData[] {
  // Step 1: Get bounding box
  onProgress?.(0, 100, "Menghitung bounding box...");
  const bbox = getGeoJSONBoundingBox(geojson);

  // Step 2: Generate target grid points (0.01° resolution)
  onProgress?.(10, 100, "Membuat grid points 0.01°...");
  const allGridPoints = generateGridPoints(bbox, TARGET_GRID_RESOLUTION);

  onProgress?.(20, 100, `Memfilter ${allGridPoints.length.toLocaleString()} grid points dalam polygon DIY...`);
  const gridPointsInDIY = filterGridPointsInPolygon(allGridPoints, geojson);

  onProgress?.(40, 100, `Replikasi nilai untuk ${gridPointsInDIY.length.toLocaleString()} grid points...`);

  // Step 3: Block fill - replicate parent grid values to sub-grids
  const replicatedPoints: PointData[] = [];
  const total = gridPointsInDIY.length;

  // Cache untuk parent cell values agar tidak perlu cari berkali-kali
  const parentCellCache = new Map<string, { ch: number | null; sh: number | null }>();

  for (let i = 0; i < gridPointsInDIY.length; i++) {
    const gridPoint = gridPointsInDIY[i];

    // Cari parent grid cell yang mengandung target point ini
    const parentCell = findParentGridCell(gridPoint, PARENT_GRID_RESOLUTION);
    const cacheKey = `${parentCell.LAT.toFixed(4)},${parentCell.LON.toFixed(4)}`;

    // Check cache dulu
    let values = parentCellCache.get(cacheKey);

    if (!values) {
      // Cari nilai CH dan SH dari parent cell
      const ch = getValueFromParentCell(parentCell, chPoints, 'CH', PARENT_GRID_RESOLUTION);
      const sh = getValueFromParentCell(parentCell, shPoints, 'SH', PARENT_GRID_RESOLUTION);
      values = { ch, sh };
      parentCellCache.set(cacheKey, values);
    }

    // Replicate parent value ke sub-grid
    if (values.ch !== null && values.sh !== null) {
      replicatedPoints.push({
        LAT: gridPoint.LAT,
        LONG: gridPoint.LON,
        CH: values.ch,
        SH: values.sh,
      });
    }

    // Update progress every 500 points (karena jumlah point banyak)
    if (i % 500 === 0 || i === total - 1) {
      const progress = 40 + Math.floor((i / total) * 50);
      onProgress?.(progress, 100, `Block fill: ${replicatedPoints.length.toLocaleString()} / ${(i + 1).toLocaleString()} points`);
    }
  }



  onProgress?.(100, 100, `Selesai! ${replicatedPoints.length.toLocaleString()} grid points (0.01° × 0.01°) dari replication`);

  return replicatedPoints;
}

/**
 * Get info tentang grid yang akan di-generate
 */
export function getGridInfo(geojson: GeoJSONCollection, resolution: number = TARGET_GRID_RESOLUTION): {
  bbox: [number, number, number, number];
  estimatedPoints: number;
  latSteps: number;
  lonSteps: number;
  parentGridInfo?: {
    resolution: number;
    estimatedParentPoints: number;
  };
} {
  const bbox = getGeoJSONBoundingBox(geojson);
  const [minLon, minLat, maxLon, maxLat] = bbox;

  const latSteps = Math.ceil((maxLat - minLat) / resolution) + 1;
  const lonSteps = Math.ceil((maxLon - minLon) / resolution) + 1;
  const estimatedPoints = latSteps * lonSteps;

  // Info parent grid (0.05°)
  const parentLatSteps = Math.ceil((maxLat - minLat) / PARENT_GRID_RESOLUTION) + 1;
  const parentLonSteps = Math.ceil((maxLon - minLon) / PARENT_GRID_RESOLUTION) + 1;
  const estimatedParentPoints = parentLatSteps * parentLonSteps;

  return {
    bbox,
    estimatedPoints,
    latSteps,
    lonSteps,
    parentGridInfo: {
      resolution: PARENT_GRID_RESOLUTION,
      estimatedParentPoints,
    },
  };
}

