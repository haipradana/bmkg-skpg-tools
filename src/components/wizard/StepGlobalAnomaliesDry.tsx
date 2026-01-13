import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SegmentedControl } from './SegmentedControl';
import { useWizardStore } from '@/store/wizardStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { KabupatenSidebar } from './KabupatenSidebar';

export const StepGlobalAnomaliesDry: React.FC = () => {
  const { kabupatenData, selectedKabupaten, updateGlobalAnomaliesDry } = useWizardStore();
  const data = kabupatenData[selectedKabupaten].globalAnomaliesDry;

  return (
    <KabupatenSidebar
      title="Anomali Iklim Global - Kering"
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
            <CardTitle>El Niño</CardTitle>
            <CardDescription>
              Fenomena pemanasan suhu permukaan laut di Pasifik Tengah dan Timur yang dapat menyebabkan penurunan curah hujan di Indonesia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.elNino}
              onChange={(val) => updateGlobalAnomaliesDry(selectedKabupaten, { elNino: val })}
              label="Status El Niño"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IOD Positif</CardTitle>
            <CardDescription>
              Indian Ocean Dipole fase positif yang umumnya menyebabkan kondisi lebih kering di sebagian wilayah Indonesia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.iodPositif}
              onChange={(val) => updateGlobalAnomaliesDry(selectedKabupaten, { iodPositif: val })}
              label="Status IOD Positif"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>El Niño Berlanjut</CardTitle>
            <CardDescription>
              Indikasi bahwa fenomena El Niño diprediksi akan berlanjut pada bulan berikutnya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.elNinoBerlanjut}
              onChange={(val) => updateGlobalAnomaliesDry(selectedKabupaten, { elNinoBerlanjut: val })}
              label="Status El Niño Berlanjut"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IOD Positif Berlanjut</CardTitle>
            <CardDescription>
              Indikasi bahwa IOD positif diprediksi akan berlanjut pada bulan berikutnya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.iodPositifBerlanjut}
              onChange={(val) => updateGlobalAnomaliesDry(selectedKabupaten, { iodPositifBerlanjut: val })}
              label="Status IOD Positif Berlanjut"
            />
          </CardContent>
        </Card>
      </div>
    </KabupatenSidebar>
  );
};
