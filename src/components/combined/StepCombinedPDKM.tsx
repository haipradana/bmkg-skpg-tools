import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SegmentedControl } from '../wizard/SegmentedControl';
import { useCombinedStore } from '@/store/combinedStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { CombinedKabupatenSidebar } from './CombinedKabupatenSidebar';

export const StepCombinedPDKM: React.FC = () => {
  const { kabupatenData, selectedKabupaten, updateKabupatenPDKM } = useCombinedStore();
  const data = kabupatenData[selectedKabupaten]?.pdkm || { pdkm: 0, pdcht: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">PDKM & PDCHT</h2>
        <p className="text-muted-foreground mt-1">
          Isi data PDKM dan PDCHT untuk setiap kabupaten
        </p>
      </div>

      <CombinedKabupatenSidebar>
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Pilih <strong>1</strong> jika kondisi aktif/ada, pilih <strong>0</strong> jika tidak ada.
            <strong className="block mt-1">Data untuk: {selectedKabupaten}</strong>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>PDKM (Ada PDKM)</CardTitle>
              <CardDescription>
                Prediksi Dasarian Kumulatif Minimum - indikasi kondisi kekeringan berdasarkan prediksi kumulatif
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SegmentedControl
                value={data.pdkm}
                onChange={(val) => updateKabupatenPDKM(selectedKabupaten, { pdkm: val })}
                label="Status PDKM"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>PDCHT (Ada PDCHT)</CardTitle>
              <CardDescription>
                Prediksi Dasarian Curah Hujan Tinggi - indikasi potensi curah hujan tinggi pada dasarian mendatang
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SegmentedControl
                value={data.pdcht}
                onChange={(val) => updateKabupatenPDKM(selectedKabupaten, { pdcht: val })}
                label="Status PDCHT"
              />
            </CardContent>
          </Card>
        </div>
      </CombinedKabupatenSidebar>
    </div>
  );
};
