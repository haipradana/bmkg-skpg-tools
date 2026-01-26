import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SegmentedControl } from '../wizard/SegmentedControl';
import { useKecamatanStore, getKecamatanFromKey } from '@/store/kecamatanStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { KecamatanSidebar } from './KecamatanSidebar';

export const StepGlobalAnomaliesWetKec: React.FC = () => {
  const { kecamatanData, selectedKecamatan, updateGlobalAnomaliesWet } = useKecamatanStore();
  const data = kecamatanData[selectedKecamatan]?.globalAnomaliesWet || {
    laNina: 0,
    iodNegatif: 0,
    laNinaBerlanjut: 0,
    iodNegatifBerlanjut: 0,
  };

  return (
    <KecamatanSidebar
      title="Anomali Iklim Global - Basah"
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
            <CardTitle>La Niña</CardTitle>
            <CardDescription>
              Jika anomali suhu permukaan laut negatif (lebih dingin dari rata - ratanya).            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.laNina}
              onChange={(val) => updateGlobalAnomaliesWet(selectedKecamatan, { laNina: val })}
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
              onChange={(val) => updateGlobalAnomaliesWet(selectedKecamatan, { iodNegatif: val })}
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
              onChange={(val) => updateGlobalAnomaliesWet(selectedKecamatan, { laNinaBerlanjut: val })}
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
              onChange={(val) => updateGlobalAnomaliesWet(selectedKecamatan, { iodNegatifBerlanjut: val })}
              label="Status IOD Negatif Berlanjut"
            />
          </CardContent>
        </Card>
      </div>
    </KecamatanSidebar>
  );
};
