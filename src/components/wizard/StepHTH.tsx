import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Upload, Calculator, CheckCircle2, Loader2 } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as turf from '@turf/turf';
import type { GeoJSONCollection } from '@/types/dryness';
import { FileUploadZone } from '@/components/ui/file-upload-zone';
import { detectCSVDelimiter, normalizeCSVRow } from '@/utils/csvUtils';


export const StepHTH: React.FC = () => {
  const { hthData, updateHTHData } = useWizardStore();
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [geojson, setGeojson] = useState<GeoJSONCollection | null>(null);

  // Load GeoJSON
  useEffect(() => {
    fetch('/kab_kota.geojson')
      .then((res) => res.json())
      .then((data: GeoJSONCollection) => {
        setGeojson(data);
      })
      .catch((err) => {
        console.error('Gagal memuat GeoJSON:', err);
      });
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      // Auto-detect delimiter (comma or semicolon)
      const delimiter = await detectCSVDelimiter(file);
      
      // Parse CSV
      Papa.parse(file, {
        header: true,
        delimiter: delimiter, // Use detected delimiter
        complete: (results) => {
          let data = results.data as Record<string, string>[];
          
          // Normalize decimal separators (comma to dot)
          data = data.map(row => normalizeCSVRow(row));
          
          if (data.length > 0) {
            const columns = Object.keys(data[0]);
            setAvailableColumns(columns);
            updateHTHData({ file, parsed: data, results: null });
            
            // Auto-detect columns
            const lonCol = columns.find(c => /^(lon|long|bujur)/i.test(c));
            const latCol = columns.find(c => /^(lat|lintang)/i.test(c));
            const hthCol = columns.find(c => /^(hth|hari)/i.test(c));
            
            if (lonCol && latCol && hthCol) {
              updateHTHData({
                columnMapping: { lon: lonCol, lat: latCol, hth: hthCol }
              });
            }
            
            toast({
              title: 'File HTH Dimuat',
              description: `${data.length} baris data berhasil dimuat (delimiter: ${delimiter === ';' ? 'semicolon' : 'comma'})`,
            });
          }
        },
        error: (error) => {
          toast({
            title: 'Error Parsing CSV',
            description: error.message,
            variant: 'destructive',
          });
        },
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parse Excel
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length > 1) {
            const headers = jsonData[0].map(String);
            const rows = jsonData.slice(1).map(row => {
              const obj: Record<string, string> = {};
              headers.forEach((header, index) => {
                obj[header] = row[index] != null ? String(row[index]) : '';
              });
              return obj;
            });
            
            setAvailableColumns(headers);
            updateHTHData({ file, parsed: rows, results: null });
            
            // Auto-detect columns
            const lonCol = headers.find(c => /^(lon|long|bujur)/i.test(c));
            const latCol = headers.find(c => /^(lat|lintang)/i.test(c));
            const hthCol = headers.find(c => /^(hth|hari)/i.test(c));
            
            if (lonCol && latCol && hthCol) {
              updateHTHData({
                columnMapping: { lon: lonCol, lat: latCol, hth: hthCol }
              });
            }
            
            toast({
              title: 'File HTH Dimuat',
              description: `${rows.length} baris data berhasil dimuat`,
            });
          }
        } catch (error) {
          toast({
            title: 'Error Parsing Excel',
            description: 'Gagal membaca file Excel',
            variant: 'destructive',
          });
        }
      };
      reader.readAsBinaryString(file);
    } else {
      toast({
        title: 'Format File Tidak Didukung',
        description: 'Hanya file CSV dan XLSX yang didukung',
        variant: 'destructive',
      });
    }
  }, [updateHTHData]);

  const handleProcess = useCallback(async () => {
    if (!hthData.parsed || !hthData.columnMapping || !geojson) {
      toast({
        title: 'Data Tidak Lengkap',
        description: 'Silakan upload file dan tentukan mapping kolom',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    // Use setTimeout to allow React to render the loading spinner before heavy processing
    setTimeout(async () => {
    try {
      // Parse HTH points
      const hthPoints: Array<{ LAT: number; LON: number; HTH: number | string }> = [];
      
      for (const row of hthData.parsed) {
        const lat = parseFloat(row[hthData.columnMapping.lat]);
        const lon = parseFloat(row[hthData.columnMapping.lon]);
        const hthVal = row[hthData.columnMapping.hth];
        
        if (isNaN(lat) || isNaN(lon)) continue;
        
        // HTH bisa berupa angka atau string "masih hujan"
        hthPoints.push({ LAT: lat, LON: lon, HTH: hthVal });
      }

      toast({
        title: 'Parsing HTH',
        description: `${hthPoints.length} titik HTH berhasil di-parse`,
      });

      // Calculate per kabupaten
      const results: Record<string, { hth_kering: 0 | 1; hth_basah: 0 | 1 }> = {};

      for (const feature of geojson.features) {
        const kabName = String(feature.properties['KAB_KOTA'] || 'Unknown');
        
        // Filter points dalam kabupaten ini
        const pointsInKab = hthPoints.filter((point) => {
          const pt = turf.point([point.LON, point.LAT]);
          try {
            if (feature.geometry.type === 'Polygon') {
              const poly = turf.polygon(feature.geometry.coordinates as number[][][]);
              return turf.booleanPointInPolygon(pt, poly);
            } else if (feature.geometry.type === 'MultiPolygon') {
              const multiPoly = turf.multiPolygon(feature.geometry.coordinates as number[][][][]);
              return turf.booleanPointInPolygon(pt, multiPoly);
            }
            return false;
          } catch {
            return false;
          }
        });

        // Filter only numeric HTH values
        const numericHTH = pointsInKab
          .map(p => typeof p.HTH === 'number' ? p.HTH : parseFloat(String(p.HTH)))
          .filter(h => !isNaN(h));

        // Check for "masih hujan" string
        const hasMasihHujan = pointsInKab.some((p) => {
          if (typeof p.HTH === 'string') {
            return p.HTH.toLowerCase().includes('hujan');
          }
          return false;
        });

        // HTH_kering = 1 if Hmax (maximum HTH in kabupaten) > 30 days
        let hasHighHTH = false;
        if (numericHTH.length > 0) {
          const maxHTH = Math.max(...numericHTH);
          hasHighHTH = maxHTH > 30;
        }

        // HTH_basah = 1 if Hmin (minimum HTH in kabupaten) < 5 days or "masih hujan"
        let hasLowHTH = hasMasihHujan;
        if (!hasLowHTH && numericHTH.length > 0) {
          const minHTH = Math.min(...numericHTH);
          hasLowHTH = minHTH < 5;
        }

        results[kabName] = {
          hth_kering: hasHighHTH ? 1 : 0,
          hth_basah: hasLowHTH ? 1 : 0,
        };
      }

      updateHTHData({ results });

      toast({
        title: 'Perhitungan Selesai ✅',
        description: `HTH berhasil dihitung untuk ${Object.keys(results).length} kabupaten`,
      });
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: 'Error Perhitungan',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses data HTH',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
    }, 50); // 50ms delay to let React render the spinner
  }, [hthData, updateHTHData, geojson]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Upload Data HTH (Hari Tanpa Hujan)</h2>
        <p className="text-muted-foreground mt-2">
          Upload file CSV/XLSX yang berisi data koordinat dan Hari Tanpa Hujan
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          File harus memiliki kolom: <strong>LON/LONG/Bujur</strong>, <strong>LAT/Lintang</strong>, dan <strong>HTH</strong>.
          <br />
          Sistem akan menghitung: HTH_kering=1 jika HTH {'>'} 30 hari, HTH_basah=1 jika HTH {'<'} 5 hari atau masih hujan.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>1. Upload File</CardTitle>
          <CardDescription>Pilih file CSV atau XLSX yang berisi data HTH</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUploadZone
            id="hth-file"
            onFileSelect={handleFileUpload}
            accept=".csv,.xlsx,.xls"
            currentFileName={hthData.file?.name}
            label="Klik untuk upload atau drag & drop"
            maxSize={50}
          />

          {hthData.parsed && (

            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              {hthData.parsed.length.toLocaleString()} baris data dimuat
            </div>
          )}
        </CardContent>
      </Card>

      {availableColumns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Mapping Kolom</CardTitle>
            <CardDescription>Tentukan kolom mana yang berisi data LON, LAT, dan HTH</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Kolom Longitude</Label>
                <Select
                  value={hthData.columnMapping?.lon || ''}
                  onValueChange={(val) =>
                    updateHTHData({
                      columnMapping: { ...hthData.columnMapping!, lon: val },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kolom LON" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kolom Latitude</Label>
                <Select
                  value={hthData.columnMapping?.lat || ''}
                  onValueChange={(val) =>
                    updateHTHData({
                      columnMapping: { ...hthData.columnMapping!, lat: val },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kolom LAT" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kolom HTH</Label>
                <Select
                  value={hthData.columnMapping?.hth || ''}
                  onValueChange={(val) =>
                    updateHTHData({
                      columnMapping: { ...hthData.columnMapping!, hth: val },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kolom HTH" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hthData.columnMapping && (
        <Card>
          <CardHeader>
            <CardTitle>3. Proses Data</CardTitle>
            <CardDescription>Hitung flag HTH untuk setiap kabupaten di DIY</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleProcess}
              disabled={isProcessing || !hthData.columnMapping}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Hitung Flag HTH
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {hthData.results && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Perhitungan HTH</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Kabupaten</th>
                    <th className="text-center p-2">HTH Kering</th>
                    <th className="text-center p-2">HTH Basah</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(hthData.results).map(([kab, flags] : [string, any]) => (
                    <tr key={kab} className="border-b">
                      <td className="p-2">{kab}</td>
                      <td className="text-center p-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-mono ${
                            flags.hth_kering === 1
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {flags.hth_kering}
                        </span>
                      </td>
                      <td className="text-center p-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-mono ${
                            flags.hth_basah === 1
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {flags.hth_basah}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

