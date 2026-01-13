import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SegmentedControl } from '../wizard/SegmentedControl';
import { useKecamatanStore, getKecamatanFromKey } from '@/store/kecamatanStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { KecamatanSidebar } from './KecamatanSidebar';

export const StepGlobalAnomaliesDryKec: React.FC = () => {
  const { kecamatanData, selectedKecamatan, updateGlobalAnomaliesDry } = useKecamatanStore();
  const data = kecamatanData[selectedKecamatan]?.globalAnomaliesDry || {
    elNino: 0,
    iodPositif: 0,
    elNinoBerlanjut: 0,
    iodPositifBerlanjut: 0,
  };

  return (
    <KecamatanSidebar
      title="Anomali Iklim Global - Kering"
      description="Isi data untuk setiap kecamatan. Setiap kecamatan bisa memiliki nilai berbeda."
    >
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Pilih <strong>1</strong> jika kondisi aktif/terjadi, pilih <strong>0</strong> jika tidak.
          <strong className="block mt-1">Data untuk: {getKecamatanFromKey(selectedKecamatan)}</strong>
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
              onChange={(val) => updateGlobalAnomaliesDry(selectedKecamatan, { elNino: val })}
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
              onChange={(val) => updateGlobalAnomaliesDry(selectedKecamatan, { iodPositif: val })}
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
              onChange={(val) => updateGlobalAnomaliesDry(selectedKecamatan, { elNinoBerlanjut: val })}
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
              onChange={(val) => updateGlobalAnomaliesDry(selectedKecamatan, { iodPositifBerlanjut: val })}
              label="Status IOD Positif Berlanjut"
            />
          </CardContent>
        </Card>
      </div>
    </KecamatanSidebar>
  );
};
