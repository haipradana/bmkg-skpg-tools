import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SegmentedControl } from './SegmentedControl';
import { useWizardStore } from '@/store/wizardStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { KabupatenSidebar } from './KabupatenSidebar';

export const StepPDKM: React.FC = () => {
  const { kabupatenData, selectedKabupaten, updatePDKM } = useWizardStore();
  const data = kabupatenData[selectedKabupaten].pdkm;

  return (
    <KabupatenSidebar
      title="PDKM & PDCHT"
      description="Isi data PDKM dan PDCHT untuk setiap kabupaten"
    >
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
              onChange={(val) => updatePDKM(selectedKabupaten, { pdkm: val })}
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
              onChange={(val) => updatePDKM(selectedKabupaten, { pdcht: val })}
              label="Status PDCHT"
            />
          </CardContent>
        </Card>
      </div>
    </KabupatenSidebar>
  );
};
