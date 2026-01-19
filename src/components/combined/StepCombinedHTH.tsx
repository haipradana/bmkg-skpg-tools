import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, Calculator, CheckCircle2, Loader2, Building2, MapPin } from 'lucide-react';
import { useCombinedStore } from '@/store/combinedStore';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as turf from '@turf/turf';
import type { GeoJSONCollection } from '@/types/dryness';
import { FileUploadZone } from '@/components/ui/file-upload-zone';
import { detectCSVDelimiter, normalizeCSVRow } from '@/utils/csvUtils';
import { getKecamatanFromKey } from '@/store/kecamatanStore';

export const StepCombinedHTH: React.FC = () => {
  const { hthData, updateHTHData } = useCombinedStore();
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [geojsonKab, setGeojsonKab] = useState<GeoJSONCollection | null>(null);
  const [geojsonKec, setGeojsonKec] = useState<GeoJSONCollection | null>(null);
  const [resultsTab, setResultsTab] = useState<'kabupaten' | 'kecamatan'>('kabupaten');

  // Load both GeoJSON files
  useEffect(() => {
    Promise.all([
      fetch('/kab_kota.geojson').then(res => res.json()),
      fetch('/batas_kec.geojson').then(res => res.json())
    ])
      .then(([kabData, kecData]) => {
        setGeojsonKab(kabData);
        setGeojsonKec(kecData);
      })
      .catch(err => {
        console.error('Gagal memuat GeoJSON:', err);
      });
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      const delimiter = await detectCSVDelimiter(file);
      
      Papa.parse(file, {
        header: true,
        delimiter: delimiter,
        complete: (results) => {
          let data = results.data as Record<string, string>[];
          data = data.map(row => normalizeCSVRow(row));
          
          if (data.length > 0) {
            const columns = Object.keys(data[0]);
            setAvailableColumns(columns);
            updateHTHData({ file, parsed: data, resultsKabupaten: null, resultsKecamatan: null });
            
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
              description: `${data.length} baris data berhasil dimuat`,
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
            updateHTHData({ file, parsed: rows, resultsKabupaten: null, resultsKecamatan: null });
            
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
    }
  }, [updateHTHData]);

  const processGeoJSON = useCallback((
    geojson: GeoJSONCollection,
    hthPoints: Array<{ LAT: number; LON: number; HTH: number | string }>,
    nameProperty: string
  ): Record<string, { hth_kering: 0 | 1; hth_basah: 0 | 1 }> => {
    const results: Record<string, { hth_kering: 0 | 1; hth_basah: 0 | 1 }> = {};

    for (const feature of geojson.features) {
      const name = String(feature.properties[nameProperty] || 'Unknown');
      
      const pointsInArea = hthPoints.filter((point) => {
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

      const numericHTH = pointsInArea
        .map(p => typeof p.HTH === 'number' ? p.HTH : parseFloat(String(p.HTH)))
        .filter(h => !isNaN(h));

      const hasMasihHujan = pointsInArea.some((p) => {
        if (typeof p.HTH === 'string') {
          return p.HTH.toLowerCase().includes('hujan');
        }
        return false;
      });

      let hasHighHTH = false;
      if (numericHTH.length > 0) {
        const maxHTH = Math.max(...numericHTH);
        hasHighHTH = maxHTH > 30;
      }

      let hasLowHTH = hasMasihHujan;
      if (!hasLowHTH && numericHTH.length > 0) {
        const minHTH = Math.min(...numericHTH);
        hasLowHTH = minHTH < 5;
      }

      results[name] = {
        hth_kering: hasHighHTH ? 1 : 0,
        hth_basah: hasLowHTH ? 1 : 0,
      };
    }

    return results;
  }, []);

  const handleProcess = useCallback(async () => {
    if (!hthData.parsed || !hthData.columnMapping || !geojsonKab || !geojsonKec) {
      toast({
        title: 'Data Tidak Lengkap',
        description: 'Silakan upload file dan tentukan mapping kolom',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(async () => {
      try {
        // Parse HTH points
        const hthPoints: Array<{ LAT: number; LON: number; HTH: number | string }> = [];
        
        for (const row of hthData.parsed!) {
          const lat = parseFloat(row[hthData.columnMapping!.lat]);
          const lon = parseFloat(row[hthData.columnMapping!.lon]);
          const hthVal = row[hthData.columnMapping!.hth];
          
          if (isNaN(lat) || isNaN(lon)) continue;
          hthPoints.push({ LAT: lat, LON: lon, HTH: hthVal });
        }

        toast({
          title: 'Parsing HTH',
          description: `${hthPoints.length} titik HTH berhasil di-parse`,
        });

        // Calculate for Kabupaten
        const resultsKabupaten = processGeoJSON(geojsonKab, hthPoints, 'KAB_KOTA');
        
        // Calculate for Kecamatan - using KECAMATAN property
        const resultsKecamatan: Record<string, { hth_kering: 0 | 1; hth_basah: 0 | 1 }> = {};
        
        for (const feature of geojsonKec.features) {
          const kabName = String(feature.properties['KAB_KOTA'] || '');
          const kecName = String(feature.properties['KECAMATAN'] || 'Unknown');
          // Create key in format "Kabupaten_Kecamatan" to match store format
          const key = `${kabName}_${kecName}`;
          
          const pointsInArea = hthPoints.filter((point) => {
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

          const numericHTH = pointsInArea
            .map(p => typeof p.HTH === 'number' ? p.HTH : parseFloat(String(p.HTH)))
            .filter(h => !isNaN(h));

          const hasMasihHujan = pointsInArea.some((p) => {
            if (typeof p.HTH === 'string') {
              return p.HTH.toLowerCase().includes('hujan');
            }
            return false;
          });

          let hasHighHTH = false;
          if (numericHTH.length > 0) {
            const maxHTH = Math.max(...numericHTH);
            hasHighHTH = maxHTH > 30;
          }

          let hasLowHTH = hasMasihHujan;
          if (!hasLowHTH && numericHTH.length > 0) {
            const minHTH = Math.min(...numericHTH);
            hasLowHTH = minHTH < 5;
          }

          resultsKecamatan[key] = {
            hth_kering: hasHighHTH ? 1 : 0,
            hth_basah: hasLowHTH ? 1 : 0,
          };
        }

        updateHTHData({ resultsKabupaten, resultsKecamatan });

        toast({
          title: 'Perhitungan Selesai ✅',
          description: `HTH berhasil dihitung untuk ${Object.keys(resultsKabupaten).length} kabupaten dan ${Object.keys(resultsKecamatan).length} kecamatan`,
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
    }, 50);
  }, [hthData, updateHTHData, geojsonKab, geojsonKec, processGeoJSON]);

  const hasResults = hthData.resultsKabupaten && hthData.resultsKecamatan;

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
          Sistem akan menghitung untuk <strong>Kabupaten</strong> dan <strong>Kecamatan</strong> sekaligus.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>1. Upload File</CardTitle>
          <CardDescription>Pilih file CSV atau XLSX yang berisi data HTH</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUploadZone
            id="hth-file-combined"
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
            <CardDescription>Hitung flag HTH untuk Kabupaten dan Kecamatan di DIY</CardDescription>
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
                  Memproses Kabupaten + Kecamatan...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Hitung Flag HTH (Kab + Kec)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {hasResults && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Perhitungan HTH</CardTitle>
            <CardDescription>
              Kabupaten: {Object.keys(hthData.resultsKabupaten!).length} wilayah • 
              Kecamatan: {Object.keys(hthData.resultsKecamatan!).length} wilayah
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={resultsTab} onValueChange={(v) => setResultsTab(v as any)}>
              <TabsList className="mb-4">
                <TabsTrigger value="kabupaten" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Kabupaten ({Object.keys(hthData.resultsKabupaten!).length})
                </TabsTrigger>
                <TabsTrigger value="kecamatan" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Kecamatan ({Object.keys(hthData.resultsKecamatan!).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="kabupaten">
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
                      {Object.entries(hthData.resultsKabupaten!).map(([kab, flags]: [string, any]) => (
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
              </TabsContent>

              <TabsContent value="kecamatan">
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b">
                        <th className="text-left p-2">Kecamatan</th>
                        <th className="text-center p-2">HTH Kering</th>
                        <th className="text-center p-2">HTH Basah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(hthData.resultsKecamatan!).map(([kec, flags]: [string, any]) => (
                        <tr key={kec} className="border-b">
                          <td className="p-2">{getKecamatanFromKey(kec)} <span className="text-xs text-muted-foreground">({kec.split('_')[0]})</span></td>
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
