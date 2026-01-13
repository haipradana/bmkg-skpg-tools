import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWizardStore, KABUPATEN_LIST } from '@/store/wizardStore';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';

export const KabupatenSummaryTable: React.FC = () => {
  const { kabupatenData, hthData, chshMonthly, chshDasarian, chshPredictionPlus1, chshPredictionPlus2, chshPredictionPlus3 } = useWizardStore();

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
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Data Per Kabupaten</CardTitle>
          <CardDescription>
            Tabel berikut menampilkan semua data yang telah diinputkan untuk setiap kabupaten
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableHead colSpan={4} className="text-center font-bold border-r bg-emerald-50">Prediksi +3</TableHead>
                  <TableHead colSpan={2} className="text-center font-bold bg-indigo-50">PDKM/PDCHT</TableHead>
                </TableRow>
                <TableRow className="bg-muted/30">
                  {/* Anomali Kering */}
                  <TableHead className="text-xs bg-red-50">El Niño</TableHead>
                  <TableHead className="text-xs border-r bg-red-50">IOD+</TableHead>
                  
                  {/* Anomali Basah */}
                  <TableHead className="text-xs bg-blue-50">La Niña</TableHead>
                  <TableHead className="text-xs border-r bg-blue-50">IOD-</TableHead>
                  
                  {/* Musim */}
                  <TableHead className="text-xs bg-amber-50">Kemarau</TableHead>
                  <TableHead className="text-xs bg-amber-50">Hujan</TableHead>
                  <TableHead className="text-xs bg-amber-50">+1 Kemarau</TableHead>
                  <TableHead className="text-xs border-r bg-amber-50">+1 Hujan</TableHead>
                  
                  {/* HTH */}
                  <TableHead className="text-xs bg-purple-50">Kering</TableHead>
                  <TableHead className="text-xs border-r bg-purple-50">Basah</TableHead>
                  
                  {/* CH/SH Bulanan */}
                  <TableHead className="text-xs bg-teal-50">CH Rendah</TableHead>
                  <TableHead className="text-xs bg-teal-50">SH BN</TableHead>
                  <TableHead className="text-xs bg-teal-50">CH Tinggi</TableHead>
                  <TableHead className="text-xs border-r bg-teal-50">SH AN</TableHead>
                  
                  {/* CH/SH Dasarian */}
                  <TableHead className="text-xs bg-cyan-50">CH Rendah</TableHead>
                  <TableHead className="text-xs bg-cyan-50">SH BN</TableHead>
                  <TableHead className="text-xs bg-cyan-50">CH Tinggi</TableHead>
                  <TableHead className="text-xs border-r bg-cyan-50">SH AN</TableHead>
                  
                  {/* Prediksi +1 */}
                  <TableHead className="text-xs bg-green-50">CH Rendah</TableHead>
                  <TableHead className="text-xs bg-green-50">SH BN</TableHead>
                  <TableHead className="text-xs bg-green-50">CH Tinggi</TableHead>
                  <TableHead className="text-xs border-r bg-green-50">SH AN</TableHead>
                  
                  {/* Prediksi +2 */}
                  <TableHead className="text-xs bg-lime-50">CH Rendah</TableHead>
                  <TableHead className="text-xs bg-lime-50">SH BN</TableHead>
                  <TableHead className="text-xs bg-lime-50">CH Tinggi</TableHead>
                  <TableHead className="text-xs border-r bg-lime-50">SH AN</TableHead>
                  
                  {/* Prediksi +3 */}
                  <TableHead className="text-xs bg-emerald-50">CH Rendah</TableHead>
                  <TableHead className="text-xs bg-emerald-50">SH BN</TableHead>
                  <TableHead className="text-xs bg-emerald-50">CH Tinggi</TableHead>
                  <TableHead className="text-xs border-r bg-emerald-50">SH AN</TableHead>
                  
                  {/* PDKM/PDCHT */}
                  <TableHead className="text-xs bg-indigo-50">PDKM</TableHead>
                  <TableHead className="text-xs bg-indigo-50">PDCHT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {KABUPATEN_LIST.map((kab) => {
                  const kabData = kabupatenData[kab];
                  
                  return (
                    <TableRow key={kab} className="hover:bg-muted/50">
                      <TableCell className="font-semibold border-r">{kab}</TableCell>
                      
                      {/* Anomali Kering */}
                      <TableCell className="text-center">{renderBadge(kabData.globalAnomaliesDry.elNino)}</TableCell>
                      <TableCell className="text-center border-r">{renderBadge(kabData.globalAnomaliesDry.iodPositif)}</TableCell>
                      
                      {/* Anomali Basah */}
                      <TableCell className="text-center">{renderBadge(kabData.globalAnomaliesWet.laNina)}</TableCell>
                      <TableCell className="text-center border-r">{renderBadge(kabData.globalAnomaliesWet.iodNegatif)}</TableCell>
                      
                      {/* Musim */}
                      <TableCell className="text-center">{renderBadge(kabData.seasonToggles.musimKemarau)}</TableCell>
                      <TableCell className="text-center">{renderBadge(kabData.seasonToggles.musimHujan)}</TableCell>
                      <TableCell className="text-center">{renderBadge(kabData.seasonToggles.bulanPlus1MusimKemarau)}</TableCell>
                      <TableCell className="text-center border-r">{renderBadge(kabData.seasonToggles.bulanPlus1MusimHujan)}</TableCell>
                      
                      {/* HTH */}
                      <TableCell className="text-center">{renderBadge(hthData.results?.[kab]?.hth_kering)}</TableCell>
                      <TableCell className="text-center border-r">{renderBadge(hthData.results?.[kab]?.hth_basah)}</TableCell>
                      
                      {/* CH/SH Bulanan */}
                      <TableCell className="text-center">{renderBadge(chshMonthly.results?.[kab]?.ch_bulanan_rendah)}</TableCell>
                      <TableCell className="text-center">{renderBadge(chshMonthly.results?.[kab]?.sh_bulanan_BN)}</TableCell>
                      <TableCell className="text-center">{renderBadge(chshMonthly.results?.[kab]?.ch_bulanan_tinggi)}</TableCell>
                      <TableCell className="text-center border-r">{renderBadge(chshMonthly.results?.[kab]?.sh_bulanan_AN)}</TableCell>
                      
                      {/* CH/SH Dasarian */}
                      <TableCell className="text-center">{renderBadge(chshDasarian.results?.[kab]?.ch_bulanan_rendah)}</TableCell>
                      <TableCell className="text-center">{renderBadge(chshDasarian.results?.[kab]?.sh_bulanan_BN)}</TableCell>
                      <TableCell className="text-center">{renderBadge(chshDasarian.results?.[kab]?.ch_bulanan_tinggi)}</TableCell>
                      <TableCell className="text-center border-r">{renderBadge(chshDasarian.results?.[kab]?.sh_bulanan_AN)}</TableCell>
                      
                      {/* Prediksi +1 */}
                      <TableCell className="text-center">{renderBadge(chshPredictionPlus1.results?.[kab]?.ch_bulanan_rendah)}</TableCell>
                      <TableCell className="text-center">{renderBadge(chshPredictionPlus1.results?.[kab]?.sh_bulanan_BN)}</TableCell>
                      <TableCell className="text-center">{renderBadge(chshPredictionPlus1.results?.[kab]?.ch_bulanan_tinggi)}</TableCell>
                      <TableCell className="text-center border-r">{renderBadge(chshPredictionPlus1.results?.[kab]?.sh_bulanan_AN)}</TableCell>
                      
                      {/* Prediksi +2 */}
                      <TableCell className="text-center">{renderBadge(chshPredictionPlus2.results?.[kab]?.ch_bulanan_rendah)}</TableCell>
                      <TableCell className="text-center">{renderBadge(chshPredictionPlus2.results?.[kab]?.sh_bulanan_BN)}</TableCell>
                      <TableCell className="text-center">{renderBadge(chshPredictionPlus2.results?.[kab]?.ch_bulanan_tinggi)}</TableCell>
                      <TableCell className="text-center border-r">{renderBadge(chshPredictionPlus2.results?.[kab]?.sh_bulanan_AN)}</TableCell>
                      
                      {/* Prediksi +3 */}
                      <TableCell className="text-center">{renderBadge(chshPredictionPlus3.results?.[kab]?.ch_bulanan_rendah)}</TableCell>
                      <TableCell className="text-center">{renderBadge(chshPredictionPlus3.results?.[kab]?.sh_bulanan_BN)}</TableCell>
                      <TableCell className="text-center">{renderBadge(chshPredictionPlus3.results?.[kab]?.ch_bulanan_tinggi)}</TableCell>
                      <TableCell className="text-center border-r">{renderBadge(chshPredictionPlus3.results?.[kab]?.sh_bulanan_AN)}</TableCell>
                      
                      {/* PDKM/PDCHT */}
                      <TableCell className="text-center">{renderBadge(kabData.pdkm.pdkm)}</TableCell>
                      <TableCell className="text-center">{renderBadge(kabData.pdkm.pdcht)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
