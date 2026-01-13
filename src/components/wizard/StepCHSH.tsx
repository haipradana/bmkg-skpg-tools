import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Upload, Calculator, CheckCircle2, Loader2 } from 'lucide-react';
import { useWizardStore, CHSHData } from '@/store/wizardStore';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { GeoJSONCollection, PointData, MetricType } from '@/types/dryness';
import { FileUploadZone } from '@/components/ui/file-upload-zone';
import { detectCSVDelimiter, normalizeCSVRow } from '@/utils/csvUtils';

import {
  parseCSVToCHPoints,
  parseCSVToSHPoints,
  filterPointsInDIY,
  matchCHAndSH,
  generateInterpolatedGrid,
} from '@/utils/mode2Calculations';
import { parseCSVToPoints, filterPointsInRegion } from '@/utils/drynessCalculations';
import * as turf from '@turf/turf';

const BoundaryMap = lazy(() => import('@/components/BoundaryMap'));

interface StepCHSHProps {
  period: 'monthly' | 'dasarian' | 'plus1' | 'plus2' | 'plus3';
  title: string;
  description: string;
}

export const StepCHSH: React.FC<StepCHSHProps> = ({ period, title, description }) => {
  const { chshMonthly, chshDasarian, chshPredictionPlus1, chshPredictionPlus2, chshPredictionPlus3, updateCHSHData } = useWizardStore();
  
  // Select the correct data based on period
  const data = 
    period === 'monthly' ? chshMonthly :
    period === 'dasarian' ? chshDasarian :
    period === 'plus1' ? chshPredictionPlus1 :
    period === 'plus2' ? chshPredictionPlus2 :
    chshPredictionPlus3;

  const [chColumns, setCHColumns] = useState<string[]>([]);
  const [shColumns, setSHColumns] = useState<string[]>([]);
  const [mode1Columns, setMode1Columns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [geojson, setGeojson] = useState<GeoJSONCollection | null>(null);
  const [matchedPoints, setMatchedPoints] = useState<PointData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('ach');

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

  const handleCHFileUpload = useCallback(async (file: File) => {

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    const parseData = (parsedData: Record<string, string>[]) => {
      if (parsedData.length > 0) {
        const columns = Object.keys(parsedData[0]);
        setCHColumns(columns);
        updateCHSHData(period, { chFile: file, chParsed: parsedData, results: null });
        
        // Auto-detect columns
        const lonCol = columns.find(c => /^(lon|long|bujur)/i.test(c));
        const latCol = columns.find(c => /^(lat|lintang)/i.test(c));
        const valCol = columns.find(c => /^(ch|val|value|curah)/i.test(c));
        
        if (lonCol && latCol && valCol) {
          updateCHSHData(period, {
            chColumnMapping: { lon: lonCol, lat: latCol, value: valCol }
          });
        }
        
        toast({
          title: 'File CH Dimuat',
          description: `${parsedData.length} baris data CH berhasil dimuat`,
        });
      }
    };

    if (fileExtension === 'csv') {
      const delimiter = await detectCSVDelimiter(file);
      Papa.parse(file, {
        header: true,
        delimiter: delimiter,
        complete: (results) => {
          let data = results.data as Record<string, string>[];
          data = data.map(row => normalizeCSVRow(row));
          parseData(data);
        },
        error: (error) => {
          toast({ title: 'Error Parsing CSV', description: error.message, variant: 'destructive' });
        },
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workData = e.target?.result;
          const workbook = XLSX.read(workData, { type: 'binary' });
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
            parseData(rows);
          }
        } catch {
          toast({ title: 'Error Parsing Excel', description: 'Gagal membaca file Excel', variant: 'destructive' });
        }
      };
      reader.readAsBinaryString(file);
    }
  }, [period, updateCHSHData]);

  const handleSHFileUpload = useCallback(async (file: File) => {

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    const parseData = (parsedData: Record<string, string>[]) => {
      if (parsedData.length > 0) {
        const columns = Object.keys(parsedData[0]);
        setSHColumns(columns);
        updateCHSHData(period, { shFile: file, shParsed: parsedData, results: null });
        
        // Auto-detect columns
        const lonCol = columns.find(c => /^(lon|long|bujur)/i.test(c));
        const latCol = columns.find(c => /^(lat|lintang)/i.test(c));
        const valCol = columns.find(c => /^(sh|val|value|sifat)/i.test(c));
        
        if (lonCol && latCol && valCol) {
          updateCHSHData(period, {
            shColumnMapping: { lon: lonCol, lat: latCol, value: valCol }
          });
        }
        
        toast({
          title: 'File SH Dimuat',
          description: `${parsedData.length} baris data SH berhasil dimuat`,
        });
      }
    };

    if (fileExtension === 'csv') {
      const delimiter = await detectCSVDelimiter(file);
      Papa.parse(file, {
        header: true,
        delimiter: delimiter,
        complete: (results) => {
          let data = results.data as Record<string, string>[];
          data = data.map(row => normalizeCSVRow(row));
          parseData(data);
        },
        error: (error) => {
          toast({ title: 'Error Parsing CSV', description: error.message, variant: 'destructive' });
        },
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workData = e.target?.result;
          const workbook = XLSX.read(workData, { type: 'binary' });
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
            parseData(rows);
          }
        } catch {
          toast({ title: 'Error Parsing Excel', description: 'Gagal membaca file Excel', variant: 'destructive' });
        }
      };
      reader.readAsBinaryString(file);
    }
  }, [period, updateCHSHData]);

  const handleProcess = useCallback(async () => {
    if (!geojson) {
      toast({
        title: 'GeoJSON Tidak Dimuat',
        description: 'Tunggu sebentar, GeoJSON sedang dimuat...',
        variant: 'destructive',
      });
      return;
    }

    // Validasi berdasarkan mode
    if (data.uploadMode === 'mode1') {
      if (!data.mode1Parsed || !data.mode1ColumnMapping) {
        toast({
          title: 'Data Tidak Lengkap',
          description: 'Silakan upload file dan tentukan mapping kolom',
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (!data.chParsed || !data.shParsed || !data.chColumnMapping || !data.shColumnMapping) {
        toast({
          title: 'Data Tidak Lengkap',
          description: 'Silakan upload kedua file dan tentukan mapping kolom',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsProcessing(true);

    // Use setTimeout to allow React to render the loading spinner before heavy processing
    setTimeout(async () => {
    try {
      let matched: PointData[];

      if (data.uploadMode === 'mode1') {
        // Mode 1: Parse langsung dari 1 file dengan CH dan SH
        // Convert parsed data ke format yang diharapkan parseCSVToPoints
        const convertedData: Record<string, string>[] = data.mode1Parsed.map(row => {
          const mapping = data.mode1ColumnMapping!;
          return {
            LAT: row[mapping.lat] || '',
            LONG: row[mapping.lon] || '',
            LON: row[mapping.lon] || '', // Support both LONG and LON
            CH: row[mapping.ch] || '',
            SH: row[mapping.sh] || '',
          };
        });

        // Parse points
        const points = parseCSVToPoints(convertedData);
        toast({
          title: 'Parsing Data',
          description: `${points.length} titik berhasil di-parse`,
        });

        if (points.length === 0) {
          toast({
            title: 'Tidak Ada Data Valid',
            description: 'Tidak ditemukan data titik yang valid dalam file',
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }

        // Filter points in DIY
        const filtered = filterPointsInRegion(points, geojson);
        toast({
          title: 'Filter DIY',
          description: `${filtered.length} titik dalam DIY`,
        });

        if (filtered.length === 0) {
          toast({
            title: 'Tidak Ada Data di DIY',
            description: 'Tidak ada titik yang berada dalam wilayah DIY',
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }

        matched = filtered;
        setMatchedPoints(matched);
      } else {
        // Mode 2: Existing logic (2 file terpisah)
        // Step 1: Parse CH points
        const chPoints = parseCSVToCHPoints(data.chParsed!);
        toast({
          title: 'Parsing CH',
          description: `${chPoints.length} titik CH berhasil di-parse`,
        });

        // Step 2: Parse SH points
        const shPoints = parseCSVToSHPoints(data.shParsed!);
        toast({
          title: 'Parsing SH',
          description: `${shPoints.length} titik SH berhasil di-parse`,
        });

        // Step 3: Filter CH points in DIY
        const chFiltered = filterPointsInDIY(chPoints, geojson);
        toast({
          title: 'Filter CH',
          description: `${chFiltered.length} titik CH dalam DIY`,
        });

        // Step 4: Filter SH points in DIY
        const shFiltered = filterPointsInDIY(shPoints, geojson);
        toast({
          title: 'Filter SH',
          description: `${shFiltered.length} titik SH dalam DIY`,
        });

        // Step 5: Match or Interpolate
        if (data.useGridInterpolation) {
          matched = generateInterpolatedGrid(chFiltered, shFiltered, geojson);
          toast({
            title: 'Grid Interpolation',
            description: `${matched.length} grid points generated`,
          });
        } else {
          matched = matchCHAndSH(chFiltered, shFiltered, data.matchingMethod);
          toast({
            title: 'Matching',
            description: `${matched.length} pasangan CH-SH berhasil di-match`,
          });
        }

        if (matched.length === 0) {
          toast({
            title: 'Tidak Ada Data',
            description: 'Tidak ada pasangan CH-SH yang berhasil di-match',
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }

        setMatchedPoints(matched);
      }

      // Step 6: Calculate per kabupaten menggunakan point-in-polygon
      const results: Record<string, any> = {};
      
      for (const feature of geojson.features) {
        const kabName = String(feature.properties['KAB_KOTA'] || 'Unknown');
        
        // Filter points dalam kabupaten ini
        const pointsInKab = matched.filter((point) => {
          const pt = turf.point([point.LONG, point.LAT]);
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

        const n_total = pointsInKab.length;

        if (n_total === 0) {
          results[kabName] = {
            ch_bulanan_rendah: 0 as 0 | 1,
            sh_bulanan_BN: 0 as 0 | 1,
            ch_bulanan_tinggi: 0 as 0 | 1,
            sh_bulanan_AN: 0 as 0 | 1,
          };
          continue;
        }

        // Hitung persentase berdasarkan threshold fixed (sesuai standar BMKG)
        // CH Rendah: 0-100mm, CH Tinggi: >= 301mm
        // SH Bawah Normal: 0-84%, SH Atas Normal: >= 116% (semua di atas 115%)
        const chLowCount = pointsInKab.filter(
          (p) => p.CH >= data.thresholds.chLow[0] && p.CH <= data.thresholds.chLow[1]
        ).length;
        const chLowPct = (chLowCount / n_total) * 100;

        const shBNCount = pointsInKab.filter(
          (p) => p.SH >= data.thresholds.shBN[0] && p.SH <= data.thresholds.shBN[1]
        ).length;
        const shBNPct = (shBNCount / n_total) * 100;

        const chHighCount = pointsInKab.filter((p) => p.CH >= data.thresholds.chHigh).length;
        const chHighPct = (chHighCount / n_total) * 100;

        // SH Atas Normal: >= 116% (tidak ada batas atas, semua yang >= 116 termasuk)
        const shANCount = pointsInKab.filter(
          (p) => p.SH >= data.thresholds.shAN[0]
        ).length;
        const shANPct = (shANCount / n_total) * 100;

        // Flag = 1 jika persentase > 10%
        results[kabName] = {
          ch_bulanan_rendah: (chLowPct > 10 ? 1 : 0) as 0 | 1,
          sh_bulanan_BN: (shBNPct > 10 ? 1 : 0) as 0 | 1,
          ch_bulanan_tinggi: (chHighPct > 10 ? 1 : 0) as 0 | 1,
          sh_bulanan_AN: (shANPct > 10 ? 1 : 0) as 0 | 1,
        };
      }

      updateCHSHData(period, { results });

      toast({
        title: 'Perhitungan Selesai ✅',
        description: `CH/SH berhasil dihitung untuk ${Object.keys(results).length} kabupaten`,
      });
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: 'Error Perhitungan',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses data',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
    }, 50); // 50ms delay to let React render the spinner
  }, [data, period, updateCHSHData, geojson]);

  // Handler untuk Mode 1 file upload
  const handleMode1FileUpload = useCallback(async (file: File) => {

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    const parseData = (parsedData: Record<string, string>[]) => {
      if (parsedData.length > 0) {
        const columns = Object.keys(parsedData[0]);
        setMode1Columns(columns);
        updateCHSHData(period, { mode1File: file, mode1Parsed: parsedData, results: null });
        
        // Auto-detect columns
        const lonCol = columns.find(c => /^(lon|long|bujur)/i.test(c));
        const latCol = columns.find(c => /^(lat|lintang)/i.test(c));
        const chCol = columns.find(c => /^(ch|curah)/i.test(c));
        const shCol = columns.find(c => /^(sh|sifat)/i.test(c));
        
        if (lonCol && latCol && chCol && shCol) {
          updateCHSHData(period, {
            mode1ColumnMapping: { lon: lonCol, lat: latCol, ch: chCol, sh: shCol }
          });
        }
        
        toast({
          title: 'File Dimuat',
          description: `${parsedData.length} baris data berhasil dimuat`,
        });
      }
    };

    if (fileExtension === 'csv') {
      const delimiter = await detectCSVDelimiter(file);
      Papa.parse(file, {
        header: true,
        delimiter: delimiter,
        complete: (results) => {
          let data = results.data as Record<string, string>[];
          data = data.map(row => normalizeCSVRow(row));
          parseData(data);
        },
        error: (error) => {
          toast({ title: 'Error Parsing CSV', description: error.message, variant: 'destructive' });
        },
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workData = e.target?.result;
          const workbook = XLSX.read(workData, { type: 'binary' });
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
            parseData(rows);
          }
        } catch {
          toast({ title: 'Error Parsing Excel', description: 'Gagal membaca file Excel', variant: 'destructive' });
        }
      };
      reader.readAsBinaryString(file);
    }
  }, [period, updateCHSHData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      {/* Mode Upload Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Mode Upload</CardTitle>
          <CardDescription>Pilih cara upload data CH dan SH</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={data.uploadMode}
            onValueChange={(v) => {
              updateCHSHData(period, { uploadMode: v as 'mode1' | 'mode2', results: null });
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mode1" id={`${period}-mode1`} />
              <Label htmlFor={`${period}-mode1`} className="cursor-pointer font-medium">
                Mode 1: Upload 1 File (CH + SH dalam 1 file)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mode2" id={`${period}-mode2`} />
              <Label htmlFor={`${period}-mode2`} className="cursor-pointer font-medium">
                Mode 2: Upload 2 File Terpisah (CH dan SH terpisah)
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {data.uploadMode === 'mode1' ? (
            <>Upload <strong>1 file</strong> yang berisi kolom LAT, LONG, CH, dan SH sekaligus.</>
          ) : (
            <>Upload <strong>2 file terpisah</strong>: CH (Curah Hujan) dan SH (Sifat Hujan). Sistem akan mencocokkan titik dan menghitung persentase berdasarkan threshold yang ditentukan.</>
          )}
        </AlertDescription>
      </Alert>

      {/* Mode Selection (untuk Mode 2) */}
      {data.uploadMode === 'mode2' && (
        <Card>
          <CardHeader>
            <CardTitle>Mode Pengolahan</CardTitle>
            <CardDescription>Pilih metode matching dan apakah menggunakan grid interpolasi</CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Metode Matching</Label>
              <RadioGroup
                value={data.matchingMethod}
                onValueChange={(v) => updateCHSHData(period, { matchingMethod: v as 'coordinates' | 'nogrid' })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="coordinates" id={`${period}-coordinates`} />
                  <Label htmlFor={`${period}-coordinates`} className="cursor-pointer">By Coordinates</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nogrid" id={`${period}-nogrid`} />
                  <Label htmlFor={`${period}-nogrid`} className="cursor-pointer">By NOGRID</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Grid Interpolasi</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${period}-grid`}
                  checked={data.useGridInterpolation}
                  onChange={(e) => updateCHSHData(period, { useGridInterpolation: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <Label htmlFor={`${period}-grid`} className="cursor-pointer">
                  Gunakan Grid 0.01° × 0.01°
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
        </Card>
      )}

      {/* File Uploads - Mode 1 */}
      {data.uploadMode === 'mode1' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload File (CH + SH dalam 1 file)</CardTitle>
            <CardDescription>File harus berisi kolom LAT, LONG, CH, dan SH</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUploadZone
              id={`${period}-mode1-file`}
              onFileSelect={handleMode1FileUpload}
              accept=".csv,.xlsx,.xls"
              currentFileName={data.mode1File?.name}
              label="Upload File (CH + SH)"
              maxSize={50}
            />
            {data.mode1Parsed && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {data.mode1Parsed.length.toLocaleString()} baris
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* File Uploads - Mode 2 */}
      {data.uploadMode === 'mode2' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CH File */}
          <Card>
            <CardHeader>
              <CardTitle>File CH (Curah Hujan)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploadZone
                id={`${period}-ch-file`}
                onFileSelect={handleCHFileUpload}
                accept=".csv,.xlsx,.xls"
                currentFileName={data.chFile?.name}
                label="Upload File CH"
                maxSize={50}
              />
              {data.chParsed && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  {data.chParsed.length.toLocaleString()} baris
                </div>
              )}
            </CardContent>
          </Card>

          {/* SH File */}
          <Card>
            <CardHeader>
              <CardTitle>File SH (Sifat Hujan)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploadZone
                id={`${period}-sh-file`}
                onFileSelect={handleSHFileUpload}
                accept=".csv,.xlsx,.xls"
                currentFileName={data.shFile?.name}
                label="Upload File SH"
                maxSize={50}
              />
              {data.shParsed && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  {data.shParsed.length.toLocaleString()} baris
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Column Mappings - Mode 1 */}
      {data.uploadMode === 'mode1' && mode1Columns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mapping Kolom</CardTitle>
            <CardDescription>Tentukan kolom untuk LAT, LONG, CH, dan SH</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                value={data.mode1ColumnMapping?.lon || ''}
                onValueChange={(val) =>
                  updateCHSHData(period, {
                    mode1ColumnMapping: { ...data.mode1ColumnMapping!, lon: val },
                  })
                }
              >
                <SelectTrigger><SelectValue placeholder="LON" /></SelectTrigger>
                <SelectContent>
                  {mode1Columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={data.mode1ColumnMapping?.lat || ''}
                onValueChange={(val) =>
                  updateCHSHData(period, {
                    mode1ColumnMapping: { ...data.mode1ColumnMapping!, lat: val },
                  })
                }
              >
                <SelectTrigger><SelectValue placeholder="LAT" /></SelectTrigger>
                <SelectContent>
                  {mode1Columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={data.mode1ColumnMapping?.ch || ''}
                onValueChange={(val) =>
                  updateCHSHData(period, {
                    mode1ColumnMapping: { ...data.mode1ColumnMapping!, ch: val },
                  })
                }
              >
                <SelectTrigger><SelectValue placeholder="CH" /></SelectTrigger>
                <SelectContent>
                  {mode1Columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={data.mode1ColumnMapping?.sh || ''}
                onValueChange={(val) =>
                  updateCHSHData(period, {
                    mode1ColumnMapping: { ...data.mode1ColumnMapping!, sh: val },
                  })
                }
              >
                <SelectTrigger><SelectValue placeholder="SH" /></SelectTrigger>
                <SelectContent>
                  {mode1Columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Column Mappings - Mode 2 */}
      {data.uploadMode === 'mode2' && (chColumns.length > 0 || shColumns.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Mapping Kolom</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {chColumns.length > 0 && (
              <div>
                <Label className="mb-2 block">CH Columns</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    value={data.chColumnMapping?.lon || ''}
                    onValueChange={(val) =>
                      updateCHSHData(period, {
                        chColumnMapping: { ...data.chColumnMapping!, lon: val },
                      })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="LON" /></SelectTrigger>
                    <SelectContent>
                      {chColumns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={data.chColumnMapping?.lat || ''}
                    onValueChange={(val) =>
                      updateCHSHData(period, {
                        chColumnMapping: { ...data.chColumnMapping!, lat: val },
                      })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="LAT" /></SelectTrigger>
                    <SelectContent>
                      {chColumns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={data.chColumnMapping?.value || ''}
                    onValueChange={(val) =>
                      updateCHSHData(period, {
                        chColumnMapping: { ...data.chColumnMapping!, value: val },
                      })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="CH/VALUE" /></SelectTrigger>
                    <SelectContent>
                      {chColumns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {shColumns.length > 0 && (
              <div>
                <Label className="mb-2 block">SH Columns</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    value={data.shColumnMapping?.lon || ''}
                    onValueChange={(val) =>
                      updateCHSHData(period, {
                        shColumnMapping: { ...data.shColumnMapping!, lon: val },
                      })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="LON" /></SelectTrigger>
                    <SelectContent>
                      {shColumns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={data.shColumnMapping?.lat || ''}
                    onValueChange={(val) =>
                      updateCHSHData(period, {
                        shColumnMapping: { ...data.shColumnMapping!, lat: val },
                      })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="LAT" /></SelectTrigger>
                    <SelectContent>
                      {shColumns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={data.shColumnMapping?.value || ''}
                    onValueChange={(val) =>
                      updateCHSHData(period, {
                        shColumnMapping: { ...data.shColumnMapping!, value: val },
                      })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="SH/VALUE" /></SelectTrigger>
                    <SelectContent>
                      {shColumns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Threshold Info (Fixed) */}
      <Card>
        <CardHeader>
          <CardTitle>Klasifikasi Threshold (Fixed)</CardTitle>
          <CardDescription>Threshold mengikuti standar klasifikasi BMKG dan tidak dapat diubah</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-2">CH (Curah Hujan):</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• CH Rendah: 0 - 100 mm</li>
                <li>• CH Tinggi: ≥ 301 mm</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">SH (Sifat Hujan):</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• SH Bawah Normal: 0 - 84%</li>
                <li>• SH Atas Normal: ≥ 116% (semua di atas 115%)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Button */}
      {((data.uploadMode === 'mode1' && data.mode1ColumnMapping) || 
        (data.uploadMode === 'mode2' && data.chColumnMapping && data.shColumnMapping)) && (
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleProcess}
              disabled={isProcessing}
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
                  Hitung Flag CH/SH
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {data.results && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Hasil Perhitungan</CardTitle>
              <CardDescription>
                Flag = 1 jika persentase titik {'>'} 10% dalam kabupaten tersebut
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Kabupaten</th>
                      <th className="text-center p-2">CH Rendah</th>
                      <th className="text-center p-2">SH BN</th>
                      <th className="text-center p-2">CH Tinggi</th>
                      <th className="text-center p-2">SH AN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.results).map(([kab, flags]: [string, { ch_bulanan_rendah: 0 | 1; sh_bulanan_BN: 0 | 1; ch_bulanan_tinggi: 0 | 1; sh_bulanan_AN: 0 | 1 }]) => (
                      <tr key={kab} className="border-b">
                        <td className="p-2">{kab}</td>
                        <td className="text-center p-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-mono ${
                            flags.ch_bulanan_rendah === 1 ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                          }`}>
                            {flags.ch_bulanan_rendah}
                          </span>
                        </td>
                        <td className="text-center p-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-mono ${
                            flags.sh_bulanan_BN === 1 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'
                          }`}>
                            {flags.sh_bulanan_BN}
                          </span>
                        </td>
                        <td className="text-center p-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-mono ${
                            flags.ch_bulanan_tinggi === 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
                          }`}>
                            {flags.ch_bulanan_tinggi}
                          </span>
                        </td>
                        <td className="text-center p-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-mono ${
                            flags.sh_bulanan_AN === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                          }`}>
                            {flags.sh_bulanan_AN}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Map Visualization */}
          {matchedPoints.length > 0 && geojson && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Visualisasi Peta</CardTitle>
                    <CardDescription>
                      {matchedPoints.length.toLocaleString()} titik grid dalam wilayah DIY
                    </CardDescription>
                  </div>
                  <Select
                    value={selectedMetric}
                    onValueChange={(v) => setSelectedMetric(v as MetricType)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ach">ACH</SelectItem>
                      <SelectItem value="ash">ASH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground">Memuat peta...</span>
                    </div>
                  }
                >
                  <BoundaryMap
                    geojson={geojson}
                    results={[]} // We'll pass empty since we're showing raw points
                    nameField="KAB_KOTA"
                    selectedMetric={selectedMetric}
                    points={matchedPoints}
                    isGridInterpolation={data.useGridInterpolation}
                  />
                </Suspense>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

