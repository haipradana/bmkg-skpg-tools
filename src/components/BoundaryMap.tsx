import React, { useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, Rectangle, Popup, Marker } from "react-leaflet";
import type { GeoJSONCollection, RegencyResult, MetricType, PointData } from "@/types/dryness";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature } from "geojson";
import type { PathOptions, LatLngBoundsExpression } from "leaflet";
import * as turf from "@turf/turf";

// Fix for default marker icons in Vite
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

interface BoundaryMapProps {
  geojson: GeoJSONCollection | null;
  results: RegencyResult[];
  nameField: string;
  selectedMetric: MetricType;
  points?: PointData[];  // Tambahan: array titik data untuk visualisasi
  isGridInterpolation?: boolean; // Flag untuk menandakan data dari grid interpolasi
  isDasarian?: boolean; // Flag untuk menandakan data dasarian (rentang warna berbeda)
}

const BoundaryMap: React.FC<BoundaryMapProps> = ({
  geojson,
  results,
  nameField,
  selectedMetric,
  points = [],
  isGridInterpolation = false,
  isDasarian = false,
}) => {
  // Debug: log jumlah points yang akan di-render
  React.useEffect(() => {

  }, [points.length, isGridInterpolation]);

  // Create a lookup map for results by regency name
  const resultsMap = useMemo(() => {
    const map = new Map<string, RegencyResult>();
    for (const r of results) {
      map.set(r.kab, r);
    }
    return map;
  }, [results]);

  // ===== DASARIAN COLOR FUNCTIONS =====
  // Fungsi warna CH untuk DASARIAN (rentang lebih kecil, 10-harian)
  const getCHColorDasarian = (ch: number): string => {
    if (ch > 300) return "#00460C";   // >300mm - Sangat Tinggi - hijau sangat tua
    if (ch >= 200) return "#369135";  // 200-300mm - Tinggi - hijau tua
    if (ch >= 150) return "#8AD58B";  // 150-200mm - Tinggi - hijau sedang
    if (ch >= 100) return "#E0FD68";  // 100-150mm - Menengah - hijau muda
    if (ch >= 75) return "#EBE100";   // 75-100mm - Menengah - kuning
    if (ch >= 50) return "#EFA800";   // 50-75mm - Menengah - kuning tua/oranye
    if (ch >= 20) return "#DC6200";   // 20-50mm - Rendah - oranye
    if (ch >= 10) return "#8E2800";   // 10-20mm - Rendah - coklat
    return "#340A00";                  // 0-10mm - Sangat Rendah - coklat tua
  };

  // Fungsi warna SH untuk DASARIAN
  const getSHColorDasarian = (sh: number): string => {
    if (sh > 200) return "#00460E";   // >200% - Atas Normal - hijau sangat tua
    if (sh >= 151) return "#238129";  // 151-200% - Atas Normal - hijau tua
    if (sh >= 116) return "#8BB700";  // 116-150% - Atas Normal - hijau
    if (sh >= 85) return "#FFFF00";   // 85-115% - Normal - kuning terang
    if (sh >= 51) return "#F3C40F";   // 51-84% - Bawah Normal - kuning
    if (sh >= 31) return "#A85B00";   // 31-50% - Bawah Normal - oranye
    return "#4A1600";                  // 0-30% - Bawah Normal - coklat tua
  };

  // ===== STANDARD (BULANAN) COLOR FUNCTIONS =====
  // Fungsi untuk mendapatkan warna berdasarkan nilai CH (Curah Hujan) - Standar BMKG Bulanan
  const getCHColor = (ch: number): string => {
    // Klasifikasi berdasarkan nilai CH dalam mm
    if (ch > 500) return "#1a4d2e"; // >500mm - Sangat Tinggi - hijau tua
    if (ch >= 401) return "#2d5a3d"; // 401-500mm - Tinggi - hijau
    if (ch >= 301) return "#4f7942"; // 301-400mm - Tinggi - hijau sedang
    if (ch >= 201) return "#8bc34a"; // 201-300mm - Menengah - hijau muda
    if (ch >= 151) return "#ffeb3b"; // 151-200mm - Menengah - kuning
    if (ch >= 101) return "#ffc107"; // 101-150mm - Menengah - kuning tua
    if (ch >= 51) return "#ff9800"; // 51-100mm - Rendah - oranye
    if (ch >= 21) return "#d35400"; // 21-50mm - Rendah - oranye gelap
    return "#8b4513"; // 0-20mm - Rendah - coklat
  };

  // Fungsi untuk mendapatkan warna berdasarkan nilai SH (Sifat Hujan %) - Standar BMKG Bulanan
  const getSHColor = (sh: number): string => {
    // Klasifikasi berdasarkan nilai SH sebagai persentase normal
    if (sh > 200) return "#1a4d2e"; // >200% - Atas Normal - hijau tua
    if (sh >= 151) return "#2d5a3d"; // 151-200% - Atas Normal - hijau
    if (sh >= 116) return "#4f7942"; // 116-150% - Atas Normal - hijau sedang
    if (sh >= 85) return "#ffeb3b"; // 85-115% - Normal - kuning
    if (sh >= 51) return "#ffc107"; // 51-84% - Bawah Normal - kuning tua
    if (sh >= 31) return "#ff9800"; // 31-50% - Bawah Normal - oranye
    return "#8b4513"; // 0-30% - Bawah Normal - coklat
  };

  // ===== LEGEND ITEMS =====
  // Legenda items untuk CH DASARIAN
  const chLegendItemsDasarian = [
    { color: "#00460C", label: "> 300 mm" },
    { color: "#369135", label: "200 - 300 mm" },
    { color: "#8AD58B", label: "150 - 200 mm" },
    { color: "#E0FD68", label: "100 - 150 mm" },
    { color: "#EBE100", label: "75 - 100 mm" },
    { color: "#EFA800", label: "50 - 75 mm" },
    { color: "#DC6200", label: "20 - 50 mm" },
    { color: "#8E2800", label: "10 - 20 mm" },
    { color: "#340A00", label: "0 - 10 mm" },
  ];

  // Legenda items untuk SH DASARIAN
  const shLegendItemsDasarian = [
    { color: "#00460E", label: "> 200%" },
    { color: "#238129", label: "151 - 200%" },
    { color: "#8BB700", label: "116 - 150%" },
    { color: "#FFFF00", label: "85 - 115%" },
    { color: "#F3C40F", label: "51 - 84%" },
    { color: "#A85B00", label: "31 - 50%" },
    { color: "#4A1600", label: "0 - 30%" },
  ];

  // Legenda items untuk CH BULANAN (standar)
  const chLegendItems = [
    { color: "#1a4d2e", label: "> 500 mm" },
    { color: "#2d5a3d", label: "401 - 500 mm" },
    { color: "#4f7942", label: "301 - 400 mm" },
    { color: "#8bc34a", label: "201 - 300 mm" },
    { color: "#ffeb3b", label: "151 - 200 mm" },
    { color: "#ffc107", label: "101 - 150 mm" },
    { color: "#ff9800", label: "51 - 100 mm" },
    { color: "#d35400", label: "21 - 50 mm" },
    { color: "#8b4513", label: "0 - 20 mm" },
  ];

  // Legenda items untuk SH BULANAN (standar)
  const shLegendItems = [
    { color: "#1a4d2e", label: "> 200%" },
    { color: "#2d5a3d", label: "151 - 200%" },
    { color: "#4f7942", label: "116 - 150%" },
    { color: "#ffeb3b", label: "85 - 115%" },
    { color: "#ffc107", label: "51 - 84%" },
    { color: "#ff9800", label: "31 - 50%" },
    { color: "#8b4513", label: "0 - 30%" },
  ];

  // Pilih fungsi warna yang sesuai berdasarkan isDasarian
  const getColorForCH = isDasarian ? getCHColorDasarian : getCHColor;
  const getColorForSH = isDasarian ? getSHColorDasarian : getSHColor;

  // Style function untuk polygon kabupaten (hanya batas, tidak diwarnai)
  const getStyle = (): PathOptions => {
    return {
      fillColor: "transparent",
      weight: 2,
      opacity: 1,
      color: "#dc2626", // Merah
      fillOpacity: 0,
    };
  };

  // Fungsi untuk menghitung centroid dari feature
  const getCentroid = (feature: any): [number, number] => {
    try {
      let turfFeature;
      if (feature.geometry.type === "Polygon") {
        turfFeature = turf.polygon(feature.geometry.coordinates as number[][][]);
      } else if (feature.geometry.type === "MultiPolygon") {
        turfFeature = turf.multiPolygon(feature.geometry.coordinates as number[][][][]);
      } else {
        // Fallback: gunakan bounds center
        const bounds = L.geoJSON(feature).getBounds();
        const center = bounds.getCenter();
        return [center.lat, center.lng];
      }
      const centroid = turf.centroid(turfFeature);
      const [lng, lat] = centroid.geometry.coordinates;
      return [lat, lng];
    } catch {
      // Fallback jika error
      const bounds = L.geoJSON(feature).getBounds();
      const center = bounds.getCenter();
      return [center.lat, center.lng];
    }
  };

  // Popup content for each feature
  const onEachFeature = (feature: Feature, layer: L.Layer) => {
    if (feature.properties) {
      const kabName = String(feature.properties[nameField] || "Unknown");
      const result = resultsMap.get(kabName);

      let popupContent = `<strong>${kabName}</strong>`;
      if (result) {
        if (selectedMetric === "ach") {
          popupContent += `<br/>Rata-rata CH: ${result.avg_ch.toFixed(1)} mm`;
          popupContent += `<br/>Persentase CH Rendah: ${result.pct_ch_rendah.toFixed(1)}%`;
          popupContent += `<br/>Indikator ACH: ${result.ach_rendah === 1 ? "Risiko Tinggi" : "Normal"}`;
        } else {
          popupContent += `<br/>Rata-rata SH: ${result.avg_sh.toFixed(1)}%`;
          popupContent += `<br/>Persentase SH BN: ${result.pct_sh_bn.toFixed(1)}%`;
          popupContent += `<br/>Indikator ASH: ${result.ash_bn === 1 ? "Risiko Tinggi" : "Normal"}`;
        }
        popupContent += `<br/>Jumlah Titik: ${result.n_total}`;
      } else {
        popupContent += `<br/>Tidak ada data`;
      }

      const pathLayer = layer as L.Path;
      pathLayer.bindPopup(popupContent);
      // Pastikan batas di atas titik-titik
      pathLayer.bringToFront();
    }
  };

  // Legenda warna sesuai berdasarkan isDasarian dan metric
  const legendItems = selectedMetric === "ach" 
    ? (isDasarian ? chLegendItemsDasarian : chLegendItems)
    : (isDasarian ? shLegendItemsDasarian : shLegendItems);

  // Pastikan hanya render di client-side
  if (typeof window === 'undefined') {
    return (
      <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center text-muted-foreground border border-border">
        Memuat peta...
      </div>
    );
  }

  if (!geojson) {
    return (
      <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center text-muted-foreground border border-border">
        Memuat peta...
      </div>
    );
  }

  return (
    <div className="relative h-[400px] rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={[-7.8, 110.4] as [number, number]}
        zoom={9}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        className="z-0"
        key={`map-${selectedMetric}-${results.length}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render titik-titik data dengan warna sesuai nilai CH/SH - render dulu agar di bawah */}
        {points.map((point, idx) => {
          const value = selectedMetric === "ach" ? point.CH : point.SH;
          const color = selectedMetric === "ach" ? getColorForCH(value) : getColorForSH(value);
          
          // Hitung bounds untuk rectangle
          // Untuk grid replication: gunakan ukuran 0.01° untuk GARANTEE NO GAP
          // Grid target: 0.01° spacing, size 0.01° = total 0.02° × 0.02° (100% overlap dengan tetangga)
          // Ini akan memastikan tidak ada gap sama sekali
          const size = isGridInterpolation ? 0.01 : 0.008; // Grid: ~1.1km (full overlap), Regular: ~880m
          const bounds: LatLngBoundsExpression = [
            [point.LAT - size, point.LONG - size],
            [point.LAT + size, point.LONG + size],
          ];
          
          return (
            <Rectangle
              key={`point-${idx}`}
              bounds={bounds}
              pathOptions={{
                fillColor: color,
                fillOpacity: isGridInterpolation ? 0.85 : 0.8,
                weight: 0,
                opacity: 0,
              }}
            >
              <Popup>
                <div style={{ fontSize: '12px' }}>
                  <strong>{isGridInterpolation ? `Grid Cell ${idx + 1}` : `Titik ${idx + 1}`}</strong>
                  <br />
                  Koordinat: {point.LAT.toFixed(4)}, {point.LONG.toFixed(4)}
                  <br />
                  CH: {point.CH.toFixed(1)} mm
                  <br />
                  SH: {point.SH.toFixed(1)}%
                  {isGridInterpolation && (
                    <>
                      <br />
                      <em style={{ fontSize: '10px', color: '#666' }}>
                        (Nilai dari replikasi parent grid 0.05°)
                      </em>
                    </>
                  )}
                </div>
              </Popup>
            </Rectangle>
          );
        })}
        
        {/* Render batas kabupaten di atas titik-titik - hanya outline tanpa fill */}
        {geojson && (
          <GeoJSON
            key={`geojson-boundary`}
            data={geojson}
            style={getStyle}
            onEachFeature={onEachFeature}
          />
        )}
        
        {/* Render label nama kabupaten */}
        {geojson && geojson.features.map((feature, idx) => {
          if (!feature.properties) return null;
          const kabName = String(feature.properties[nameField] || "");
          if (!kabName || kabName === "Unknown") return null;
          
          const centroid = getCentroid(feature);
          
          // Buat DivIcon untuk label tanpa background
          const labelIcon = L.divIcon({
            className: "kabupaten-label",
            html: `<div style="
              font-size: 12px;
              font-weight: 700;
              color: #1f2937;
              white-space: nowrap;
              pointer-events: none;
              text-shadow: 
                -1px -1px 2px rgba(255, 255, 255, 0.9),
                1px -1px 2px rgba(255, 255, 255, 0.9),
                -1px 1px 2px rgba(255, 255, 255, 0.9),
                1px 1px 2px rgba(255, 255, 255, 0.9),
                0 0 4px rgba(255, 255, 255, 0.9);
            ">${kabName}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          });
          
          return (
            <Marker
              key={`label-${idx}`}
              position={centroid}
              icon={labelIcon}
              interactive={false}
            />
          );
        })}
      </MapContainer>
      
      {/* Legenda - tampil jika ada points atau results */}
      {(points.length > 0 || results.length > 0) && (
        <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm rounded-md p-3 shadow-lg border border-border z-[1000] max-h-[80vh] overflow-y-auto">
          <div className="text-xs font-semibold mb-2 text-foreground">
            {selectedMetric === "ach" ? "Curah Hujan (mm)" : "Sifat Hujan (%)"}
          </div>
          <div className="space-y-1">
            {legendItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px]">
                <div 
                  className="w-4 h-3 rounded-sm border border-border/50 flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="leading-tight text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoundaryMap;
