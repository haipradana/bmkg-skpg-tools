import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, Calculator, CheckCircle2, Loader2, Building2, MapPin } from 'lucide-react';
import { useCombinedStore } from '@/store/combinedStore';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { GeoJSONCollection, PointData, MetricType } from '@/types/dryness';
import { FileUploadZone } from '@/components/ui/file-upload-zone';
import { detectCSVDelimiter, normalizeCSVRow } from '@/utils/csvUtils';
import { getKecamatanFromKey } from '@/store/kecamatanStore';
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

interface StepCombinedCHSHProps {
  period: 'monthly' | 'dasarian' | 'plus1' | 'plus2' | 'plus3';
  title: string;
  description: string;
}

// Helper function to calculate flags for a feature
const calculateFlags = (
  pointsInArea: PointData[],
  thresholds: { chLow: [number, number]; shBN: [number, number]; chHigh: number; shAN: [number, number] }
) => {
  const n_total = pointsInArea.length;
  
  if (n_total === 0) {
    return {
      ch_bulanan_rendah: 0 as 0 | 1,
      sh_bulanan_BN: 0 as 0 | 1,
      ch_bulanan_tinggi: 0 as 0 | 1,
      sh_bulanan_AN: 0 as 0 | 1,
    };
  }

  const chLowCount = pointsInArea.filter(
    (p) => p.CH >= thresholds.chLow[0] && p.CH <= thresholds.chLow[1]
  ).length;
  const chLowPct = (chLowCount / n_total) * 100;

  const shBNCount = pointsInArea.filter(
    (p) => p.SH >= thresholds.shBN[0] && p.SH <= thresholds.shBN[1]
  ).length;
  const shBNPct = (shBNCount / n_total) * 100;

  const chHighCount = pointsInArea.filter((p) => p.CH >= thresholds.chHigh).length;
  const chHighPct = (chHighCount / n_total) * 100;

  const shANCount = pointsInArea.filter((p) => p.SH >= thresholds.shAN[0]).length;
  const shANPct = (shANCount / n_total) * 100;

  return {
    ch_bulanan_rendah: (chLowPct > 10 ? 1 : 0) as 0 | 1,
    sh_bulanan_BN: (shBNPct > 10 ? 1 : 0) as 0 | 1,
    ch_bulanan_tinggi: (chHighPct > 10 ? 1 : 0) as 0 | 1,
    sh_bulanan_AN: (shANPct > 10 ? 1 : 0) as 0 | 1,
  };
};

// Helper function to filter points in polygon
const filterPointsInPolygon = (
  points: PointData[],
  feature: any
): PointData[] => {
  return points.filter((point) => {
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
};

export const StepCombinedCHSH: React.FC<StepCombinedCHSHProps> = ({ period, title, description }) => {
  const { 
    chshMonthly, chshDasarian, chshPredictionPlus1, chshPredictionPlus2, chshPredictionPlus3, 
    updateCHSHData 
  } = useCombinedStore();
  
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
  const [geojsonKab, setGeojsonKab] = useState<GeoJSONCollection | null>(null);
  const [geojsonKec, setGeojsonKec] = useState<GeoJSONCollection | null>(null);
  const [matchedPoints, setMatchedPoints] = useState<PointData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('ach');
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

  // File upload handlers (Mode 1)
  const handleMode1FileUpload = useCallback(async (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    const parseData = (parsedData: Record<string, string>[]) => {
      if (parsedData.length > 0) {
        const columns = Object.keys(parsedData[0]);
        setMode1Columns(columns);
        updateCHSHData(period, { mode1File: file, mode1Parsed: parsedData, resultsKabupaten: null, resultsKecamatan: null });
        
        const lonCol = columns.find(c => /^(lon|long|bujur)/i.test(c));
        const latCol = columns.find(c => /^(lat|lintang)/i.test(c));
        const chCol = columns.find(c => /^(ch|curah)/i.test(c));
        const shCol = columns.find(c => /^(sh|sifat)/i.test(c));
        
        if (lonCol && latCol && chCol && shCol) {
          updateCHSHData(period, {
            mode1ColumnMapping: { lon: lonCol, lat: latCol, ch: chCol, sh: shCol }
          });
        }
        
        toast({ title: 'File Dimuat', description: `${parsedData.length} baris data berhasil dimuat` });
      }
    };

    if (fileExtension === 'csv') {
      const delimiter = await detectCSVDelimiter(file);
      Papa.parse(file, {
        header: true,
        delimiter: delimiter,
        complete: (results) => {
          let csvData = results.data as Record<string, string>[];
          csvData = csvData.map(row => normalizeCSVRow(row));
          parseData(csvData);
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

  // CH File upload (Mode 2)
  const handleCHFileUpload = useCallback(async (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    const parseData = (parsedData: Record<string, string>[]) => {
      if (parsedData.length > 0) {
        const columns = Object.keys(parsedData[0]);
        setCHColumns(columns);
        updateCHSHData(period, { chFile: file, chParsed: parsedData, resultsKabupaten: null, resultsKecamatan: null });
        
        const lonCol = columns.find(c => /^(lon|long|bujur)/i.test(c));
        const latCol = columns.find(c => /^(lat|lintang)/i.test(c));
        const valCol = columns.find(c => /^(ch|val|value|curah)/i.test(c));
        
        if (lonCol && latCol && valCol) {
          updateCHSHData(period, { chColumnMapping: { lon: lonCol, lat: latCol, value: valCol } });
        }
        
        toast({ title: 'File CH Dimuat', description: `${parsedData.length} baris data CH berhasil dimuat` });
      }
    };

    if (fileExtension === 'csv') {
      const delimiter = await detectCSVDelimiter(file);
      Papa.parse(file, {
        header: true,
        delimiter: delimiter,
        complete: (results) => {
          let csvData = results.data as Record<string, string>[];
          csvData = csvData.map(row => normalizeCSVRow(row));
          parseData(csvData);
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

  // SH File upload (Mode 2)
  const handleSHFileUpload = useCallback(async (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    const parseData = (parsedData: Record<string, string>[]) => {
      if (parsedData.length > 0) {
        const columns = Object.keys(parsedData[0]);
        setSHColumns(columns);
        updateCHSHData(period, { shFile: file, shParsed: parsedData, resultsKabupaten: null, resultsKecamatan: null });
        
        const lonCol = columns.find(c => /^(lon|long|bujur)/i.test(c));
        const latCol = columns.find(c => /^(lat|lintang)/i.test(c));
        const valCol = columns.find(c => /^(sh|val|value|sifat)/i.test(c));
        
        if (lonCol && latCol && valCol) {
          updateCHSHData(period, { shColumnMapping: { lon: lonCol, lat: latCol, value: valCol } });
        }
        
        toast({ title: 'File SH Dimuat', description: `${parsedData.length} baris data SH berhasil dimuat` });
      }
    };

    if (fileExtension === 'csv') {
      const delimiter = await detectCSVDelimiter(file);
      Papa.parse(file, {
        header: true,
        delimiter: delimiter,
        complete: (results) => {
          let csvData = results.data as Record<string, string>[];
          csvData = csvData.map(row => normalizeCSVRow(row));
          parseData(csvData);
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

  // Process data for both Kabupaten and Kecamatan
  const handleProcess = useCallback(async () => {
    if (!geojsonKab || !geojsonKec) {
      toast({ title: 'GeoJSON Tidak Dimuat', description: 'Tunggu sebentar...', variant: 'destructive' });
      return;
    }

    if (data.uploadMode === 'mode1') {
      if (!data.mode1Parsed || !data.mode1ColumnMapping) {
        toast({ title: 'Data Tidak Lengkap', description: 'Silakan upload file dan tentukan mapping kolom', variant: 'destructive' });
        return;
      }
    } else {
      if (!data.chParsed || !data.shParsed || !data.chColumnMapping || !data.shColumnMapping) {
        toast({ title: 'Data Tidak Lengkap', description: 'Silakan upload kedua file dan tentukan mapping kolom', variant: 'destructive' });
        return;
      }
    }

    setIsProcessing(true);

    setTimeout(async () => {
      try {
        let matched: PointData[];

        if (data.uploadMode === 'mode1') {
          const convertedData: Record<string, string>[] = data.mode1Parsed!.map(row => {
            const mapping = data.mode1ColumnMapping!;
            return {
              LAT: row[mapping.lat] || '',
              LONG: row[mapping.lon] || '',
              LON: row[mapping.lon] || '',
              CH: row[mapping.ch] || '',
              SH: row[mapping.sh] || '',
            };
          });

          const points = parseCSVToPoints(convertedData);
          if (points.length === 0) {
            toast({ title: 'Tidak Ada Data Valid', description: 'Tidak ditemukan data titik yang valid', variant: 'destructive' });
            setIsProcessing(false);
            return;
          }

          const filtered = filterPointsInRegion(points, geojsonKab);
          if (filtered.length === 0) {
            toast({ title: 'Tidak Ada Data di DIY', description: 'Tidak ada titik dalam wilayah DIY', variant: 'destructive' });
            setIsProcessing(false);
            return;
          }

          matched = filtered;
        } else {
          const chPoints = parseCSVToCHPoints(data.chParsed!);
          const shPoints = parseCSVToSHPoints(data.shParsed!);
          const chFiltered = filterPointsInDIY(chPoints, geojsonKab);
          const shFiltered = filterPointsInDIY(shPoints, geojsonKab);

          if (data.useGridInterpolation) {
            matched = generateInterpolatedGrid(chFiltered, shFiltered, geojsonKab);
          } else {
            matched = matchCHAndSH(chFiltered, shFiltered, data.matchingMethod);
          }

          if (matched.length === 0) {
            toast({ title: 'Tidak Ada Data', description: 'Tidak ada pasangan CH-SH yang berhasil di-match', variant: 'destructive' });
            setIsProcessing(false);
            return;
          }
        }

        setMatchedPoints(matched);

        // Calculate for Kabupaten
        const resultsKabupaten: Record<string, any> = {};
        for (const feature of geojsonKab.features) {
          const kabName = String(feature.properties['KAB_KOTA'] || 'Unknown');
          const pointsInKab = filterPointsInPolygon(matched, feature);
          resultsKabupaten[kabName] = calculateFlags(pointsInKab, data.thresholds);
        }

        // Calculate for Kecamatan
        const resultsKecamatan: Record<string, any> = {};
        for (const feature of geojsonKec.features) {
          const kabName = String(feature.properties['KAB_KOTA'] || '');
          const kecName = String(feature.properties['KECAMATAN'] || 'Unknown');
          const key = `${kabName}_${kecName}`;
          const pointsInKec = filterPointsInPolygon(matched, feature);
          resultsKecamatan[key] = calculateFlags(pointsInKec, data.thresholds);
        }

        updateCHSHData(period, { resultsKabupaten, resultsKecamatan });

        toast({
          title: 'Perhitungan Selesai ✅',
          description: `CH/SH berhasil dihitung untuk ${Object.keys(resultsKabupaten).length} kabupaten dan ${Object.keys(resultsKecamatan).length} kecamatan`,
        });
      } catch (error) {
        console.error('Processing error:', error);
        toast({ title: 'Error Perhitungan', description: error instanceof Error ? error.message : 'Terjadi kesalahan', variant: 'destructive' });
      } finally {
        setIsProcessing(false);
      }
    }, 50);
  }, [data, period, updateCHSHData, geojsonKab, geojsonKec]);

  const hasResults = data.resultsKabupaten && data.resultsKecamatan;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Sistem akan menghitung untuk <strong>Kabupaten</strong> dan <strong>Kecamatan</strong> sekaligus.
        </AlertDescription>
      </Alert>

      {/* Mode Upload Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Mode Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={data.uploadMode}
            onValueChange={(v) => updateCHSHData(period, { uploadMode: v as 'mode1' | 'mode2', resultsKabupaten: null, resultsKecamatan: null })}
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
                Mode 2: Upload 2 File Terpisah
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Mode 2 Options */}
      {data.uploadMode === 'mode2' && (
        <Card>
          <CardHeader>
            <CardTitle>Mode Pengolahan</CardTitle>
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
          <Card>
            <CardHeader><CardTitle>File CH (Curah Hujan)</CardTitle></CardHeader>
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
          <Card>
            <CardHeader><CardTitle>File SH (Sifat Hujan)</CardTitle></CardHeader>
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
          <CardHeader><CardTitle>Mapping Kolom</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={data.mode1ColumnMapping?.lon || ''} onValueChange={(val) => updateCHSHData(period, { mode1ColumnMapping: { ...data.mode1ColumnMapping!, lon: val } })}>
                <SelectTrigger><SelectValue placeholder="LON" /></SelectTrigger>
                <SelectContent>{mode1Columns.map((col) => <SelectItem key={col} value={col}>{col}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={data.mode1ColumnMapping?.lat || ''} onValueChange={(val) => updateCHSHData(period, { mode1ColumnMapping: { ...data.mode1ColumnMapping!, lat: val } })}>
                <SelectTrigger><SelectValue placeholder="LAT" /></SelectTrigger>
                <SelectContent>{mode1Columns.map((col) => <SelectItem key={col} value={col}>{col}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={data.mode1ColumnMapping?.ch || ''} onValueChange={(val) => updateCHSHData(period, { mode1ColumnMapping: { ...data.mode1ColumnMapping!, ch: val } })}>
                <SelectTrigger><SelectValue placeholder="CH" /></SelectTrigger>
                <SelectContent>{mode1Columns.map((col) => <SelectItem key={col} value={col}>{col}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={data.mode1ColumnMapping?.sh || ''} onValueChange={(val) => updateCHSHData(period, { mode1ColumnMapping: { ...data.mode1ColumnMapping!, sh: val } })}>
                <SelectTrigger><SelectValue placeholder="SH" /></SelectTrigger>
                <SelectContent>{mode1Columns.map((col) => <SelectItem key={col} value={col}>{col}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Column Mappings - Mode 2 */}
      {data.uploadMode === 'mode2' && (chColumns.length > 0 || shColumns.length > 0) && (
        <Card>
          <CardHeader><CardTitle>Mapping Kolom</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {chColumns.length > 0 && (
              <div>
                <Label className="mb-2 block">CH Columns</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select value={data.chColumnMapping?.lon || ''} onValueChange={(val) => updateCHSHData(period, { chColumnMapping: { ...data.chColumnMapping!, lon: val } })}>
                    <SelectTrigger><SelectValue placeholder="LON" /></SelectTrigger>
                    <SelectContent>{chColumns.map((col) => <SelectItem key={col} value={col}>{col}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={data.chColumnMapping?.lat || ''} onValueChange={(val) => updateCHSHData(period, { chColumnMapping: { ...data.chColumnMapping!, lat: val } })}>
                    <SelectTrigger><SelectValue placeholder="LAT" /></SelectTrigger>
                    <SelectContent>{chColumns.map((col) => <SelectItem key={col} value={col}>{col}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={data.chColumnMapping?.value || ''} onValueChange={(val) => updateCHSHData(period, { chColumnMapping: { ...data.chColumnMapping!, value: val } })}>
                    <SelectTrigger><SelectValue placeholder="CH/VALUE" /></SelectTrigger>
                    <SelectContent>{chColumns.map((col) => <SelectItem key={col} value={col}>{col}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {shColumns.length > 0 && (
              <div>
                <Label className="mb-2 block">SH Columns</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select value={data.shColumnMapping?.lon || ''} onValueChange={(val) => updateCHSHData(period, { shColumnMapping: { ...data.shColumnMapping!, lon: val } })}>
                    <SelectTrigger><SelectValue placeholder="LON" /></SelectTrigger>
                    <SelectContent>{shColumns.map((col) => <SelectItem key={col} value={col}>{col}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={data.shColumnMapping?.lat || ''} onValueChange={(val) => updateCHSHData(period, { shColumnMapping: { ...data.shColumnMapping!, lat: val } })}>
                    <SelectTrigger><SelectValue placeholder="LAT" /></SelectTrigger>
                    <SelectContent>{shColumns.map((col) => <SelectItem key={col} value={col}>{col}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={data.shColumnMapping?.value || ''} onValueChange={(val) => updateCHSHData(period, { shColumnMapping: { ...data.shColumnMapping!, value: val } })}>
                    <SelectTrigger><SelectValue placeholder="SH/VALUE" /></SelectTrigger>
                    <SelectContent>{shColumns.map((col) => <SelectItem key={col} value={col}>{col}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fixed Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Klasifikasi Threshold (Fixed)</CardTitle>
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
                <li>• SH Atas Normal: ≥ 116%</li>
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
            <Button onClick={handleProcess} disabled={isProcessing} className="w-full" size="lg">
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses Kabupaten + Kecamatan...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Hitung Flag CH/SH (Kab + Kec)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results with Tabs */}
      {hasResults && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Hasil Perhitungan</CardTitle>
              <CardDescription>
                Kabupaten: {Object.keys(data.resultsKabupaten!).length} wilayah • 
                Kecamatan: {Object.keys(data.resultsKecamatan!).length} wilayah
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={resultsTab} onValueChange={(v) => setResultsTab(v as any)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="kabupaten" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Kabupaten ({Object.keys(data.resultsKabupaten!).length})
                  </TabsTrigger>
                  <TabsTrigger value="kecamatan" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Kecamatan ({Object.keys(data.resultsKecamatan!).length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="kabupaten">
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
                        {Object.entries(data.resultsKabupaten!).map(([kab, flags]: [string, any]) => (
                          <tr key={kab} className="border-b">
                            <td className="p-2">{kab}</td>
                            <td className="text-center p-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-mono ${flags.ch_bulanan_rendah === 1 ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
                                {flags.ch_bulanan_rendah}
                              </span>
                            </td>
                            <td className="text-center p-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-mono ${flags.sh_bulanan_BN === 1 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'}`}>
                                {flags.sh_bulanan_BN}
                              </span>
                            </td>
                            <td className="text-center p-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-mono ${flags.ch_bulanan_tinggi === 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
                                {flags.ch_bulanan_tinggi}
                              </span>
                            </td>
                            <td className="text-center p-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-mono ${flags.sh_bulanan_AN === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                                {flags.sh_bulanan_AN}
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
                          <th className="text-center p-2">CH Rendah</th>
                          <th className="text-center p-2">SH BN</th>
                          <th className="text-center p-2">CH Tinggi</th>
                          <th className="text-center p-2">SH AN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(data.resultsKecamatan!).map(([kec, flags]: [string, any]) => (
                          <tr key={kec} className="border-b">
                            <td className="p-2">{getKecamatanFromKey(kec)} <span className="text-xs text-muted-foreground">({kec.split('_')[0]})</span></td>
                            <td className="text-center p-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-mono ${flags.ch_bulanan_rendah === 1 ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
                                {flags.ch_bulanan_rendah}
                              </span>
                            </td>
                            <td className="text-center p-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-mono ${flags.sh_bulanan_BN === 1 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'}`}>
                                {flags.sh_bulanan_BN}
                              </span>
                            </td>
                            <td className="text-center p-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-mono ${flags.ch_bulanan_tinggi === 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
                                {flags.ch_bulanan_tinggi}
                              </span>
                            </td>
                            <td className="text-center p-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-mono ${flags.sh_bulanan_AN === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                                {flags.sh_bulanan_AN}
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

          {/* Map Visualization - using Kecamatan boundaries */}
          {matchedPoints.length > 0 && geojsonKec && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Visualisasi Peta</CardTitle>
                    <CardDescription>
                      {matchedPoints.length.toLocaleString()} titik grid • Batas Kecamatan
                    </CardDescription>
                  </div>
                  <Select value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as MetricType)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ach">ACH</SelectItem>
                      <SelectItem value="ash">ASH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="h-[400px] bg-muted rounded-lg flex items-center justify-center"><span className="text-muted-foreground">Memuat peta...</span></div>}>
                  <BoundaryMap
                    geojson={geojsonKec}
                    results={[]}
                    nameField="KECAMATAN"
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
