import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SegmentedControl } from './SegmentedControl';
import { useWizardStore } from '@/store/wizardStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { KabupatenSidebar } from './KabupatenSidebar';

export const StepGlobalAnomaliesWet: React.FC = () => {
  const { kabupatenData, selectedKabupaten, updateGlobalAnomaliesWet } = useWizardStore();
  const data = kabupatenData[selectedKabupaten].globalAnomaliesWet;

  return (
    <KabupatenSidebar
      title="Anomali Iklim Global - Basah"
      description="Isi data untuk setiap kabupaten. Setiap kabupaten bisa memiliki nilai berbeda."
    >
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Pilih <strong>1</strong> jika kondisi aktif/terjadi, pilih <strong>0</strong> jika tidak.
          <strong className="block mt-1">Data untuk: {selectedKabupaten}</strong>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>La Niña</CardTitle>
            <CardDescription>
              Jika anomali suhu permukaan laut negatif (lebih dingin dari rata - ratanya).            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.laNina}
              onChange={(val) => updateGlobalAnomaliesWet(selectedKabupaten, { laNina: val })}
              label="Status La Niña"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IOD Negatif</CardTitle>
            <CardDescription>
              Indian Ocean Dipole Negatif berdampak terhadap peningkatan curah  hujan di Indonesia bagian barat. 
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.iodNegatif}
              onChange={(val) => updateGlobalAnomaliesWet(selectedKabupaten, { iodNegatif: val })}
              label="Status IOD Negatif"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>La Niña Berlanjut</CardTitle>
            <CardDescription>
              Indikasi bahwa fenomena La Niña diprediksi akan berlanjut pada bulan berikutnya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.laNinaBerlanjut}
              onChange={(val) => updateGlobalAnomaliesWet(selectedKabupaten, { laNinaBerlanjut: val })}
              label="Status La Niña Berlanjut"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IOD Negatif Berlanjut</CardTitle>
            <CardDescription>
              Indikasi bahwa IOD negatif diprediksi akan berlanjut pada bulan berikutnya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.iodNegatifBerlanjut}
              onChange={(val) => updateGlobalAnomaliesWet(selectedKabupaten, { iodNegatifBerlanjut: val })}
              label="Status IOD Negatif Berlanjut"
            />
          </CardContent>
        </Card>
      </div>
    </KabupatenSidebar>
  );
};
