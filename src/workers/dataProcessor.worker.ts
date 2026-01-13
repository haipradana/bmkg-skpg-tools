// Web Worker for heavy data processing tasks
// This worker handles point-in-polygon calculations, grid interpolation, and matching

import * as turf from '@turf/turf';

export interface WorkerMessage {
  type: 'PROCESS_HTH' | 'PROCESS_CHSH' | 'MATCH_POINTS' | 'FILTER_BBOX';
  data: any;
}

export interface WorkerResponse {
  type: 'PROGRESS' | 'COMPLETE' | 'ERROR';
  data?: any;
  progress?: number;
  message?: string;
}

// Listen for messages from main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;

  try {
    switch (type) {
      case 'FILTER_BBOX':
        filterBBox(data);
        break;
      case 'MATCH_POINTS':
        matchPoints(data);
        break;
      case 'PROCESS_HTH':
        processHTH(data);
        break;
      case 'PROCESS_CHSH':
        processCHSH(data);
        break;
      default:
        postMessage({
          type: 'ERROR',
          message: `Unknown message type: ${type}`,
        } as WorkerResponse);
    }
  } catch (error) {
    postMessage({
      type: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    } as WorkerResponse);
  }
});

function filterBBox(data: { points: any[]; bbox: number[] }) {
  const { points, bbox } = data;
  const [minLon, minLat, maxLon, maxLat] = bbox;
  
  postMessage({
    type: 'PROGRESS',
    progress: 0,
    message: 'Filtering points by bounding box...',
  } as WorkerResponse);

  const filtered = points.filter((point, index) => {
    if (index % 1000 === 0) {
      postMessage({
        type: 'PROGRESS',
        progress: (index / points.length) * 100,
        message: `Filtered ${index} / ${points.length} points`,
      } as WorkerResponse);
    }
    
    return (
      point.LON >= minLon &&
      point.LON <= maxLon &&
      point.LAT >= minLat &&
      point.LAT <= maxLat
    );
  });

  postMessage({
    type: 'COMPLETE',
    data: filtered,
    message: `Filtered ${filtered.length} points from ${points.length}`,
  } as WorkerResponse);
}

function matchPoints(data: { chPoints: any[]; shPoints: any[]; method: 'coordinates' | 'nogrid' }) {
  const { chPoints, shPoints, method } = data;
  
  postMessage({
    type: 'PROGRESS',
    progress: 0,
    message: 'Matching CH and SH points...',
  } as WorkerResponse);

  const matched: any[] = [];

  if (method === 'nogrid') {
    // Match by NOGRID
    const shMap = new Map(shPoints.map(p => [p.NOGRID, p]));
    
    chPoints.forEach((chPoint, index) => {
      if (index % 100 === 0) {
        postMessage({
          type: 'PROGRESS',
          progress: (index / chPoints.length) * 100,
          message: `Matched ${index} / ${chPoints.length} points`,
        } as WorkerResponse);
      }
      
      const shPoint = shMap.get(chPoint.NOGRID);
      if (shPoint) {
        matched.push({
          LAT: chPoint.LAT,
          LONG: chPoint.LON,
          CH: chPoint.CH,
          SH: shPoint.SH,
          NOGRID: chPoint.NOGRID,
        });
      }
    });
  } else {
    // Match by coordinates (with tolerance)
    const tolerance = 0.0001;
    
    chPoints.forEach((chPoint, index) => {
      if (index % 100 === 0) {
        postMessage({
          type: 'PROGRESS',
          progress: (index / chPoints.length) * 100,
          message: `Matched ${index} / ${chPoints.length} points`,
        } as WorkerResponse);
      }
      
      const shPoint = shPoints.find(
        s =>
          Math.abs(s.LAT - chPoint.LAT) < tolerance &&
          Math.abs(s.LON - chPoint.LON) < tolerance
      );
      
      if (shPoint) {
        matched.push({
          LAT: chPoint.LAT,
          LONG: chPoint.LON,
          CH: chPoint.CH,
          SH: shPoint.SH,
        });
      }
    });
  }

  postMessage({
    type: 'COMPLETE',
    data: matched,
    message: `Matched ${matched.length} points`,
  } as WorkerResponse);
}

function processHTH(data: { points: any[]; geojson: any; nameField: string }) {
  const { points, geojson, nameField } = data;
  
  postMessage({
    type: 'PROGRESS',
    progress: 0,
    message: 'Processing HTH data...',
  } as WorkerResponse);

  // Group points by kabupaten
  const kabResults: Record<string, { hth_kering: 0 | 1; hth_basah: 0 | 1 }> = {};
  
  geojson.features.forEach((feature: any, featureIndex: number) => {
    const kabName = feature.properties[nameField];
    const polygon = turf.polygon(feature.geometry.coordinates);
    
    postMessage({
      type: 'PROGRESS',
      progress: (featureIndex / geojson.features.length) * 100,
      message: `Processing ${kabName}...`,
    } as WorkerResponse);
    
    const pointsInKab = points.filter(p => {
      const point = turf.point([p.LON, p.LAT]);
      return turf.booleanPointInPolygon(point, polygon);
    });
    
    // Calculate flags
    const hasHighHTH = pointsInKab.some(p => p.HTH > 30);
    const hasLowHTH = pointsInKab.some(p => p.HTH < 5 || p.HTH === 'masih hujan');
    
    kabResults[kabName] = {
      hth_kering: hasHighHTH ? 1 : 0,
      hth_basah: hasLowHTH ? 1 : 0,
    };
  });

  postMessage({
    type: 'COMPLETE',
    data: kabResults,
    message: 'HTH processing complete',
  } as WorkerResponse);
}

function processCHSH(data: {
  points: any[];
  geojson: any;
  nameField: string;
  thresholds: any;
}) {
  const { points, geojson, nameField, thresholds } = data;
  
  postMessage({
    type: 'PROGRESS',
    progress: 0,
    message: 'Processing CH/SH data...',
  } as WorkerResponse);

  const kabResults: Record<string, any> = {};
  
  geojson.features.forEach((feature: any, featureIndex: number) => {
    const kabName = feature.properties[nameField];
    const polygon = turf.polygon(feature.geometry.coordinates);
    
    postMessage({
      type: 'PROGRESS',
      progress: (featureIndex / geojson.features.length) * 100,
      message: `Processing ${kabName}...`,
    } as WorkerResponse);
    
    const pointsInKab = points.filter(p => {
      const point = turf.point([p.LONG, p.LAT]);
      return turf.booleanPointInPolygon(point, polygon);
    });
    
    if (pointsInKab.length === 0) {
      kabResults[kabName] = {
        ch_bulanan_rendah: 0,
        sh_bulanan_BN: 0,
        ch_bulanan_tinggi: 0,
        sh_bulanan_AN: 0,
      };
      return;
    }
    
    // Calculate percentages
    const chLowCount = pointsInKab.filter(
      p => p.CH >= thresholds.chLow[0] && p.CH <= thresholds.chLow[1]
    ).length;
    const chLowPct = (chLowCount / pointsInKab.length) * 100;
    
    const shBNCount = pointsInKab.filter(
      p => p.SH >= thresholds.shBN[0] && p.SH <= thresholds.shBN[1]
    ).length;
    const shBNPct = (shBNCount / pointsInKab.length) * 100;
    
    const chHighCount = pointsInKab.filter(p => p.CH >= thresholds.chHigh).length;
    const chHighPct = (chHighCount / pointsInKab.length) * 100;
    
    const shANCount = pointsInKab.filter(
      p => p.SH >= thresholds.shAN[0] && p.SH <= thresholds.shAN[1]
    ).length;
    const shANPct = (shANCount / pointsInKab.length) * 100;
    
    kabResults[kabName] = {
      ch_bulanan_rendah: chLowPct > 10 ? 1 : 0,
      sh_bulanan_BN: shBNPct > 10 ? 1 : 0,
      ch_bulanan_tinggi: chHighPct > 10 ? 1 : 0,
      sh_bulanan_AN: shANPct > 10 ? 1 : 0,
    };
  });

  postMessage({
    type: 'COMPLETE',
    data: kabResults,
    message: 'CH/SH processing complete',
  } as WorkerResponse);
}

// Export empty object to make TypeScript happy
export {};

