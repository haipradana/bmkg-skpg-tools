import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Download, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FileUpload from "@/components/FileUpload";
import ResultsTable from "@/components/ResultsTable";
import type { RegencyResult, GeoJSONCollection, MetricType } from "@/types/dryness";

// Dynamic import untuk BoundaryMap agar hanya dimuat di client-side
const BoundaryMap = lazy(() => import("@/components/BoundaryMap"));
import {
  parseCSVToPoints,
  calculateDrynessIndicators,
  resultsToCSV,
  getGeoJSONPropertyKeys,
  filterPointsInRegion,
} from "@/utils/drynessCalculations";
import { toast } from "@/hooks/use-toast";

const Kecamatan: React.FC = () => {
  // State for input data
  const [csvData, setCsvData] = useState<Record<string, string>[] | null>(null);
  const [period, setPeriod] = useState("202510");
  const [nameField, setNameField] = useState("KECAMATAN");
  const [availableFields, setAvailableFields] = useState<string[]>([]);

  // State for GeoJSON boundary
  const [geojson, setGeojson] = useState<GeoJSONCollection | null>(null);

  // State for results
  const [results, setResults] = useState<RegencyResult[]>([]);
  const [isComputing, setIsComputing] = useState(false);

  // State for map
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("ach");
  const [parsedPoints, setParsedPoints] = useState<any[]>([]);

  // Load GeoJSON boundary on mount (gunakan batas_kec.geojson untuk kecamatan)
  useEffect(() => {
    fetch("/batas_kec.geojson")
      .then((res) => res.json())
      .then((data: GeoJSONCollection) => {
        setGeojson(data);
        const fields = getGeoJSONPropertyKeys(data);
        setAvailableFields(fields);
        // Set default name field if KECAMATAN exists
        if (fields.includes("KECAMATAN")) {
          setNameField("KECAMATAN");
        } else if (fields.length > 0) {
          setNameField(fields[0]);
        }
      })
      .catch((err) => {
        console.error("Gagal memuat GeoJSON:", err);
        toast({
          title: "Error",
          description: "Gagal memuat file batas wilayah GeoJSON",
          variant: "destructive",
        });
      });
  }, []);

  // Handle CSV data parsed
  const handleDataParsed = useCallback((data: Record<string, string>[]) => {
    setCsvData(data);
    setResults([]); // Clear previous results
    toast({
      title: "CSV Dimuat",
      description: `Berhasil memuat ${data.length.toLocaleString()} baris data`,
    });
  }, []);

  // Handle CSV parsing error
  const handleError = useCallback((error: string) => {
    toast({
      title: "Error",
      description: error,
      variant: "destructive",
    });
  }, []);

  // Compute dryness indicators
  const handleCompute = useCallback(() => {
    if (!csvData || !geojson) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Silakan unggah file CSV terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setIsComputing(true);

    // Use setTimeout to allow UI to update before computation
    setTimeout(() => {
      try {
        const points = parseCSVToPoints(csvData);

        if (points.length === 0) {
          toast({
            title: "Tidak Ada Data Valid",
            description: "Tidak ditemukan data titik yang valid dalam CSV",
            variant: "destructive",
          });
          setIsComputing(false);
          return;
        }

        // Filter points to only include those within DIY region
        const filteredPoints = filterPointsInRegion(points, geojson);
        
        if (filteredPoints.length === 0) {
          toast({
            title: "Tidak Ada Data di DIY",
            description: `Dari ${points.length} titik, tidak ada yang berada dalam wilayah DIY`,
            variant: "destructive",
          });
          setIsComputing(false);
          return;
        }
        
        // Info jika ada filtering
        if (filteredPoints.length < points.length) {
          toast({
            title: "Data Difilter",
            description: `${filteredPoints.length} dari ${points.length} titik berada dalam wilayah DIY`,
          });
        }

        // Simpan filtered points untuk visualisasi peta
        setParsedPoints(filteredPoints);

        const computedResults = calculateDrynessIndicators(filteredPoints, geojson, nameField);
        setResults(computedResults);

        toast({
          title: "Perhitungan Selesai",
          description: `Menganalisis ${points.length.toLocaleString()} titik di ${computedResults.length} kecamatan`,
        });
      } catch (err) {
        console.error("Computation error:", err);
        toast({
          title: "Error Perhitungan",
          description: "Terjadi kesalahan saat melakukan perhitungan",
          variant: "destructive",
        });
      } finally {
        setIsComputing(false);
      }
    }, 100);
  }, [csvData, geojson, nameField]);

  // Download results as CSV
  const handleDownload = useCallback(() => {
    if (results.length === 0) {
      toast({
        title: "Tidak Ada Hasil",
        description: "Silakan lakukan perhitungan terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const csvContent = resultsToCSV(results, period);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `indikator_kekeringan_kecamatan_${period}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Berhasil Diunduh",
      description: `Hasil disimpan sebagai indikator_kekeringan_kecamatan_${period}.csv`,
    });
  }, [results, period]);

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Input Section dengan 2 Kolom */}
          <section className="data-card">
            <h2 className="text-lg font-semibold mb-4">Input Data</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Kolom Kiri - Input */}
              <div className="space-y-6">
                {/* File Upload */}
                <FileUpload onDataParsed={handleDataParsed} onError={handleError} />

                {/* Settings Row */}
                <div className="space-y-4">
                  {/* Period Input */}
                  <div className="space-y-2">
                    <Label htmlFor="period">Periode (YYYYMM)</Label>
                    <Input
                      id="period"
                      type="text"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      placeholder="contoh: 202510"
                      maxLength={6}
                    />
                  </div>

                  {/* Name Field Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="nameField">Field Nama Batas</Label>
                    <Select value={nameField} onValueChange={setNameField}>
                      <SelectTrigger id="nameField">
                        <SelectValue placeholder="Pilih field" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map((field) => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Compute Button */}
                  <Button
                    onClick={handleCompute}
                    disabled={!csvData || isComputing}
                    className="w-full"
                  >
                    {isComputing ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Menghitung...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4 mr-2" />
                        Hitung
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Kolom Kanan - Peta */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Peta Kecamatan D.I. Yogyakarta</Label>
                  {results.length > 0 && (
                    <Select
                      value={selectedMetric}
                      onValueChange={(v) => setSelectedMetric(v as MetricType)}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ach">ACH</SelectItem>
                        <SelectItem value="ash">ASH</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <Suspense fallback={
                  <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center text-muted-foreground border border-border">
                    Memuat peta...
                  </div>
                }>
                  <BoundaryMap
                    geojson={geojson}
                    results={results}
                    nameField={nameField}
                    selectedMetric={selectedMetric}
                    points={parsedPoints}
                  />
                </Suspense>
              </div>
            </div>
          </section>

          {/* Results Section */}
          <section className="data-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Hasil Analisis</h2>
              <div className="flex items-center gap-2">
                {results.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Unduh CSV
                  </Button>
                )}
              </div>
            </div>

            {/* Results Table */}
            <ResultsTable results={results} period={period} />
          </section>

          {/* Instructions */}
          <section className="text-center text-sm text-muted-foreground py-4">
            <p>
              Unggah file CSV dengan kolom LAT, LONG, CH (Curah Hujan dalam mm), dan SH (Sifat Hujan dalam %).
              Aplikasi akan menghitung indikator kekeringan untuk setiap kecamatan di DIY.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Kecamatan;
