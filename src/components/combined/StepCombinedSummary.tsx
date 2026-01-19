import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileSpreadsheet, CheckCircle2, RotateCcw, Building2, MapPin, XCircle } from 'lucide-react';
import { useCombinedStore } from '@/store/combinedStore';
import { KABUPATEN_LIST } from '@/store/wizardStore';
import { KECAMATAN_LIST, getKecamatanFromKey } from '@/store/kecamatanStore';
import { exportCombinedToExcel } from '@/utils/excelExportCombined';

export const StepCombinedSummary: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'kabupaten' | 'kecamatan'>('kabupaten');
  const { 
    resetWizard, 
    kabupatenData, 
    kecamatanData, 
    hthData, 
    chshMonthly, 
    chshDasarian, 
    chshPredictionPlus1, 
    chshPredictionPlus2, 
    chshPredictionPlus3 
  } = useCombinedStore();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportCombinedToExcel();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Gagal mengekspor data. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset semua data? Semua input akan dihapus dan Anda akan kembali ke langkah pertama.')) {
      resetWizard();
    }
  };

  const renderBadge = (value: number | undefined) => {
    if (value === undefined || value === null) {
      return <Badge variant="outline" className="bg-gray-100">-</Badge>;
    }
    
    return value === 1 ? (
      <Badge className="bg-green-500 hover:bg-green-600">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        1
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-100">
        <XCircle className="w-3 h-3 mr-1" />
        0
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-green-800">
                Ringkasan Data & Export
              </CardTitle>
              <p className="text-sm text-green-600 mt-1">
                Semua data telah berhasil diinputkan. Export akan menghasilkan <strong>2 file Excel</strong>: Kabupaten dan Kecamatan.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Mengekspor 2 File...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Export ke Excel (2 File)
                </>
              )}
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileSpreadsheet className="h-4 w-4" />
              <span>SKPG_Kabupaten.xlsx + SKPG_Kecamatan.xlsx</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Tables with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Data</CardTitle>
          <CardDescription>
            Lihat ringkasan untuk Kabupaten ({KABUPATEN_LIST.length}) atau Kecamatan ({KECAMATAN_LIST.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="kabupaten" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Kabupaten ({KABUPATEN_LIST.length})
              </TabsTrigger>
              <TabsTrigger value="kecamatan" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Kecamatan ({KECAMATAN_LIST.length})
              </TabsTrigger>
            </TabsList>

            {/* Kabupaten Table */}
            <TabsContent value="kabupaten">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead rowSpan={2} className="font-bold border-r">Kabupaten</TableHead>
                      <TableHead colSpan={2} className="text-center font-bold border-r bg-red-50">Anomali Kering</TableHead>
                      <TableHead colSpan={2} className="text-center font-bold border-r bg-blue-50">Anomali Basah</TableHead>
                      <TableHead colSpan={4} className="text-center font-bold border-r bg-amber-50">Musim</TableHead>
                      <TableHead colSpan={2} className="text-center font-bold border-r bg-purple-50">HTH</TableHead>
                      <TableHead colSpan={4} className="text-center font-bold border-r bg-teal-50">CH/SH Bulanan</TableHead>
                      <TableHead colSpan={4} className="text-center font-bold border-r bg-cyan-50">CH/SH Dasarian</TableHead>
                      <TableHead colSpan={4} className="text-center font-bold border-r bg-green-50">Prediksi +1</TableHead>
                      <TableHead colSpan={4} className="text-center font-bold border-r bg-lime-50">Prediksi +2</TableHead>
                      <TableHead colSpan={4} className="text-center font-bold bg-emerald-50">Prediksi +3</TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs bg-red-50">El Niño</TableHead>
                      <TableHead className="text-xs border-r bg-red-50">IOD+</TableHead>
                      <TableHead className="text-xs bg-blue-50">La Niña</TableHead>
                      <TableHead className="text-xs border-r bg-blue-50">IOD-</TableHead>
                      <TableHead className="text-xs bg-amber-50">Kemarau</TableHead>
                      <TableHead className="text-xs bg-amber-50">Hujan</TableHead>
                      <TableHead className="text-xs bg-amber-50">+1 Kemarau</TableHead>
                      <TableHead className="text-xs border-r bg-amber-50">+1 Hujan</TableHead>
                      <TableHead className="text-xs bg-purple-50">Kering</TableHead>
                      <TableHead className="text-xs border-r bg-purple-50">Basah</TableHead>
                      <TableHead className="text-xs bg-teal-50">CH↓</TableHead>
                      <TableHead className="text-xs bg-teal-50">SH BN</TableHead>
                      <TableHead className="text-xs bg-teal-50">CH↑</TableHead>
                      <TableHead className="text-xs border-r bg-teal-50">SH AN</TableHead>
                      <TableHead className="text-xs bg-cyan-50">CH↓</TableHead>
                      <TableHead className="text-xs bg-cyan-50">SH BN</TableHead>
                      <TableHead className="text-xs bg-cyan-50">CH↑</TableHead>
                      <TableHead className="text-xs border-r bg-cyan-50">SH AN</TableHead>
                      <TableHead className="text-xs bg-green-50">CH↓</TableHead>
                      <TableHead className="text-xs bg-green-50">SH BN</TableHead>
                      <TableHead className="text-xs bg-green-50">CH↑</TableHead>
                      <TableHead className="text-xs border-r bg-green-50">SH AN</TableHead>
                      <TableHead className="text-xs bg-lime-50">CH↓</TableHead>
                      <TableHead className="text-xs bg-lime-50">SH BN</TableHead>
                      <TableHead className="text-xs bg-lime-50">CH↑</TableHead>
                      <TableHead className="text-xs border-r bg-lime-50">SH AN</TableHead>
                      <TableHead className="text-xs bg-emerald-50">CH↓</TableHead>
                      <TableHead className="text-xs bg-emerald-50">SH BN</TableHead>
                      <TableHead className="text-xs bg-emerald-50">CH↑</TableHead>
                      <TableHead className="text-xs bg-emerald-50">SH AN</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {KABUPATEN_LIST.map((kab) => {
                      const kabData = kabupatenData[kab];
                      return (
                        <TableRow key={kab} className="hover:bg-muted/50">
                          <TableCell className="font-semibold border-r">{kab}</TableCell>
                          <TableCell className="text-center">{renderBadge(kabData?.globalAnomaliesDry?.elNino)}</TableCell>
                          <TableCell className="text-center border-r">{renderBadge(kabData?.globalAnomaliesDry?.iodPositif)}</TableCell>
                          <TableCell className="text-center">{renderBadge(kabData?.globalAnomaliesWet?.laNina)}</TableCell>
                          <TableCell className="text-center border-r">{renderBadge(kabData?.globalAnomaliesWet?.iodNegatif)}</TableCell>
                          <TableCell className="text-center">{renderBadge(kabData?.seasonToggles?.musimKemarau)}</TableCell>
                          <TableCell className="text-center">{renderBadge(kabData?.seasonToggles?.musimHujan)}</TableCell>
                          <TableCell className="text-center">{renderBadge(kabData?.seasonToggles?.bulanPlus1MusimKemarau)}</TableCell>
                          <TableCell className="text-center border-r">{renderBadge(kabData?.seasonToggles?.bulanPlus1MusimHujan)}</TableCell>
                          <TableCell className="text-center">{renderBadge(hthData.resultsKabupaten?.[kab]?.hth_kering)}</TableCell>
                          <TableCell className="text-center border-r">{renderBadge(hthData.resultsKabupaten?.[kab]?.hth_basah)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshMonthly.resultsKabupaten?.[kab]?.ch_bulanan_rendah)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshMonthly.resultsKabupaten?.[kab]?.sh_bulanan_BN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshMonthly.resultsKabupaten?.[kab]?.ch_bulanan_tinggi)}</TableCell>
                          <TableCell className="text-center border-r">{renderBadge(chshMonthly.resultsKabupaten?.[kab]?.sh_bulanan_AN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshDasarian.resultsKabupaten?.[kab]?.ch_bulanan_rendah)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshDasarian.resultsKabupaten?.[kab]?.sh_bulanan_BN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshDasarian.resultsKabupaten?.[kab]?.ch_bulanan_tinggi)}</TableCell>
                          <TableCell className="text-center border-r">{renderBadge(chshDasarian.resultsKabupaten?.[kab]?.sh_bulanan_AN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus1.resultsKabupaten?.[kab]?.ch_bulanan_rendah)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus1.resultsKabupaten?.[kab]?.sh_bulanan_BN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus1.resultsKabupaten?.[kab]?.ch_bulanan_tinggi)}</TableCell>
                          <TableCell className="text-center border-r">{renderBadge(chshPredictionPlus1.resultsKabupaten?.[kab]?.sh_bulanan_AN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus2.resultsKabupaten?.[kab]?.ch_bulanan_rendah)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus2.resultsKabupaten?.[kab]?.sh_bulanan_BN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus2.resultsKabupaten?.[kab]?.ch_bulanan_tinggi)}</TableCell>
                          <TableCell className="text-center border-r">{renderBadge(chshPredictionPlus2.resultsKabupaten?.[kab]?.sh_bulanan_AN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus3.resultsKabupaten?.[kab]?.ch_bulanan_rendah)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus3.resultsKabupaten?.[kab]?.sh_bulanan_BN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus3.resultsKabupaten?.[kab]?.ch_bulanan_tinggi)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus3.resultsKabupaten?.[kab]?.sh_bulanan_AN)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Kecamatan Table */}
            <TabsContent value="kecamatan">
              <div className="overflow-x-auto max-h-[500px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className="bg-muted/50">
                      <TableHead rowSpan={2} className="font-bold border-r">Kecamatan</TableHead>
                      <TableHead colSpan={2} className="text-center font-bold border-r bg-red-50">Anomali Kering</TableHead>
                      <TableHead colSpan={2} className="text-center font-bold border-r bg-blue-50">Anomali Basah</TableHead>
                      <TableHead colSpan={4} className="text-center font-bold border-r bg-amber-50">Musim</TableHead>
                      <TableHead colSpan={2} className="text-center font-bold border-r bg-purple-50">HTH</TableHead>
                      <TableHead colSpan={4} className="text-center font-bold border-r bg-teal-50">CH/SH Bulanan</TableHead>
                      <TableHead colSpan={4} className="text-center font-bold border-r bg-cyan-50">CH/SH Dasarian</TableHead>
                      <TableHead colSpan={4} className="text-center font-bold border-r bg-green-50">Prediksi +1</TableHead>
                      <TableHead colSpan={4} className="text-center font-bold border-r bg-lime-50">Prediksi +2</TableHead>
                      <TableHead colSpan={4} className="text-center font-bold bg-emerald-50">Prediksi +3</TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs bg-red-50">El Niño</TableHead>
                      <TableHead className="text-xs border-r bg-red-50">IOD+</TableHead>
                      <TableHead className="text-xs bg-blue-50">La Niña</TableHead>
                      <TableHead className="text-xs border-r bg-blue-50">IOD-</TableHead>
                      <TableHead className="text-xs bg-amber-50">Kemarau</TableHead>
                      <TableHead className="text-xs bg-amber-50">Hujan</TableHead>
                      <TableHead className="text-xs bg-amber-50">+1 Kemarau</TableHead>
                      <TableHead className="text-xs border-r bg-amber-50">+1 Hujan</TableHead>
                      <TableHead className="text-xs bg-purple-50">Kering</TableHead>
                      <TableHead className="text-xs border-r bg-purple-50">Basah</TableHead>
                      <TableHead className="text-xs bg-teal-50">CH↓</TableHead>
                      <TableHead className="text-xs bg-teal-50">SH BN</TableHead>
                      <TableHead className="text-xs bg-teal-50">CH↑</TableHead>
                      <TableHead className="text-xs border-r bg-teal-50">SH AN</TableHead>
                      <TableHead className="text-xs bg-cyan-50">CH↓</TableHead>
                      <TableHead className="text-xs bg-cyan-50">SH BN</TableHead>
                      <TableHead className="text-xs bg-cyan-50">CH↑</TableHead>
                      <TableHead className="text-xs border-r bg-cyan-50">SH AN</TableHead>
                      <TableHead className="text-xs bg-green-50">CH↓</TableHead>
                      <TableHead className="text-xs bg-green-50">SH BN</TableHead>
                      <TableHead className="text-xs bg-green-50">CH↑</TableHead>
                      <TableHead className="text-xs border-r bg-green-50">SH AN</TableHead>
                      <TableHead className="text-xs bg-lime-50">CH↓</TableHead>
                      <TableHead className="text-xs bg-lime-50">SH BN</TableHead>
                      <TableHead className="text-xs bg-lime-50">CH↑</TableHead>
                      <TableHead className="text-xs border-r bg-lime-50">SH AN</TableHead>
                      <TableHead className="text-xs bg-emerald-50">CH↓</TableHead>
                      <TableHead className="text-xs bg-emerald-50">SH BN</TableHead>
                      <TableHead className="text-xs bg-emerald-50">CH↑</TableHead>
                      <TableHead className="text-xs bg-emerald-50">SH AN</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {KECAMATAN_LIST.map((kec) => {
                      const kecData = kecamatanData[kec];
                      const displayName = getKecamatanFromKey(kec);
                      const kabName = kec.split('_')[0];
                      return (
                        <TableRow key={kec} className="hover:bg-muted/50">
                          <TableCell className="font-semibold border-r">
                            {displayName} <span className="text-xs text-muted-foreground">({kabName})</span>
                          </TableCell>
                          <TableCell className="text-center">{renderBadge(kecData?.globalAnomaliesDry?.elNino)}</TableCell>
                          <TableCell className="text-center border-r">{renderBadge(kecData?.globalAnomaliesDry?.iodPositif)}</TableCell>
                          <TableCell className="text-center">{renderBadge(kecData?.globalAnomaliesWet?.laNina)}</TableCell>
                          <TableCell className="text-center border-r">{renderBadge(kecData?.globalAnomaliesWet?.iodNegatif)}</TableCell>
                          <TableCell className="text-center">{renderBadge(kecData?.seasonToggles?.musimKemarau)}</TableCell>
                          <TableCell className="text-center">{renderBadge(kecData?.seasonToggles?.musimHujan)}</TableCell>
                          <TableCell className="text-center">{renderBadge(kecData?.seasonToggles?.bulanPlus1MusimKemarau)}</TableCell>
                          <TableCell className="text-center border-r">{renderBadge(kecData?.seasonToggles?.bulanPlus1MusimHujan)}</TableCell>
                          <TableCell className="text-center">{renderBadge(hthData.resultsKecamatan?.[kec]?.hth_kering)}</TableCell>
                          <TableCell className="text-center border-r">{renderBadge(hthData.resultsKecamatan?.[kec]?.hth_basah)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshMonthly.resultsKecamatan?.[kec]?.ch_bulanan_rendah)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshMonthly.resultsKecamatan?.[kec]?.sh_bulanan_BN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshMonthly.resultsKecamatan?.[kec]?.ch_bulanan_tinggi)}</TableCell>
                          <TableCell className="text-center border-r">{renderBadge(chshMonthly.resultsKecamatan?.[kec]?.sh_bulanan_AN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshDasarian.resultsKecamatan?.[kec]?.ch_bulanan_rendah)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshDasarian.resultsKecamatan?.[kec]?.sh_bulanan_BN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshDasarian.resultsKecamatan?.[kec]?.ch_bulanan_tinggi)}</TableCell>
                          <TableCell className="text-center border-r">{renderBadge(chshDasarian.resultsKecamatan?.[kec]?.sh_bulanan_AN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus1.resultsKecamatan?.[kec]?.ch_bulanan_rendah)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus1.resultsKecamatan?.[kec]?.sh_bulanan_BN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus1.resultsKecamatan?.[kec]?.ch_bulanan_tinggi)}</TableCell>
                          <TableCell className="text-center border-r">{renderBadge(chshPredictionPlus1.resultsKecamatan?.[kec]?.sh_bulanan_AN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus2.resultsKecamatan?.[kec]?.ch_bulanan_rendah)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus2.resultsKecamatan?.[kec]?.sh_bulanan_BN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus2.resultsKecamatan?.[kec]?.ch_bulanan_tinggi)}</TableCell>
                          <TableCell className="text-center border-r">{renderBadge(chshPredictionPlus2.resultsKecamatan?.[kec]?.sh_bulanan_AN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus3.resultsKecamatan?.[kec]?.ch_bulanan_rendah)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus3.resultsKecamatan?.[kec]?.sh_bulanan_BN)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus3.resultsKecamatan?.[kec]?.ch_bulanan_tinggi)}</TableCell>
                          <TableCell className="text-center">{renderBadge(chshPredictionPlus3.resultsKecamatan?.[kec]?.sh_bulanan_AN)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleReset}
          variant="destructive"
          size="lg"
          className="shadow-md"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Reset Semua Data (Mulai Bulan Baru)
        </Button>
      </div>
    </div>
  );
};
