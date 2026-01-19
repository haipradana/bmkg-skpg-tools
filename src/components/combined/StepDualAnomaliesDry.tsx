import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SegmentedControl } from '@/components/wizard/SegmentedControl';
import { useCombinedStore } from '@/store/combinedStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { CombinedKabupatenSidebar } from './CombinedKabupatenSidebar';
import { CombinedKecamatanSidebar } from './CombinedKecamatanSidebar';
import { DualInputTabs } from './DualInputTabs';
import { getKecamatanFromKey } from '@/store/kecamatanStore';

// Kabupaten Content
const KabupatenAnomalyDryContent: React.FC = () => {
  const { kabupatenData, selectedKabupaten, updateKabupatenGlobalAnomaliesDry } = useCombinedStore();
  const data = kabupatenData[selectedKabupaten].globalAnomaliesDry;

  return (
    <CombinedKabupatenSidebar>
      <Alert className="mb-6 bg-amber-50 border-amber-200">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
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
              onChange={(val) => updateKabupatenGlobalAnomaliesDry(selectedKabupaten, { elNino: val })}
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
              onChange={(val) => updateKabupatenGlobalAnomaliesDry(selectedKabupaten, { iodPositif: val })}
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
              onChange={(val) => updateKabupatenGlobalAnomaliesDry(selectedKabupaten, { elNinoBerlanjut: val })}
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
              onChange={(val) => updateKabupatenGlobalAnomaliesDry(selectedKabupaten, { iodPositifBerlanjut: val })}
              label="Status IOD Positif Berlanjut"
            />
          </CardContent>
        </Card>
      </div>
    </CombinedKabupatenSidebar>
  );
};

// Kecamatan Content
const KecamatanAnomalyDryContent: React.FC = () => {
  const { kecamatanData, selectedKecamatan, updateKecamatanGlobalAnomaliesDry } = useCombinedStore();
  const data = kecamatanData[selectedKecamatan]?.globalAnomaliesDry || {
    elNino: 0,
    iodPositif: 0,
    elNinoBerlanjut: 0,
    iodPositifBerlanjut: 0,
  };
  const displayName = getKecamatanFromKey(selectedKecamatan);

  return (
    <CombinedKecamatanSidebar>
      <Alert className="mb-6 bg-teal-50 border-teal-200">
        <Info className="h-4 w-4 text-teal-600" />
        <AlertDescription className="text-teal-800">
          Pilih <strong>1</strong> jika kondisi aktif/terjadi, pilih <strong>0</strong> jika tidak.
          <strong className="block mt-1">Data untuk: {displayName}</strong>
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
              onChange={(val) => updateKecamatanGlobalAnomaliesDry(selectedKecamatan, { elNino: val })}
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
              onChange={(val) => updateKecamatanGlobalAnomaliesDry(selectedKecamatan, { iodPositif: val })}
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
              onChange={(val) => updateKecamatanGlobalAnomaliesDry(selectedKecamatan, { elNinoBerlanjut: val })}
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
              onChange={(val) => updateKecamatanGlobalAnomaliesDry(selectedKecamatan, { iodPositifBerlanjut: val })}
              label="Status IOD Positif Berlanjut"
            />
          </CardContent>
        </Card>
      </div>
    </CombinedKecamatanSidebar>
  );
};

// Main Component with Dual Tabs
export const StepDualAnomaliesDry: React.FC = () => {
  return (
    <DualInputTabs
      title="Anomali Iklim Global - Kering"
      description="Isi data anomali kering untuk Kabupaten dan Kecamatan (terpisah)."
      kabupatenContent={<KabupatenAnomalyDryContent />}
      kecamatanContent={<KecamatanAnomalyDryContent />}
    />
  );
};
