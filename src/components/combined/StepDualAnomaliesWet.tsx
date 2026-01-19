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
const KabupatenAnomalyWetContent: React.FC = () => {
  const { kabupatenData, selectedKabupaten, updateKabupatenGlobalAnomaliesWet } = useCombinedStore();
  const data = kabupatenData[selectedKabupaten].globalAnomaliesWet;

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
            <CardTitle>La Niña</CardTitle>
            <CardDescription>
              Fenomena pendinginan suhu permukaan laut di Pasifik Tengah dan Timur yang dapat meningkatkan curah hujan di Indonesia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.laNina}
              onChange={(val) => updateKabupatenGlobalAnomaliesWet(selectedKabupaten, { laNina: val })}
              label="Status La Niña"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IOD Negatif</CardTitle>
            <CardDescription>
              Indian Ocean Dipole fase negatif yang umumnya menyebabkan kondisi lebih basah di sebagian wilayah Indonesia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.iodNegatif}
              onChange={(val) => updateKabupatenGlobalAnomaliesWet(selectedKabupaten, { iodNegatif: val })}
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
              onChange={(val) => updateKabupatenGlobalAnomaliesWet(selectedKabupaten, { laNinaBerlanjut: val })}
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
              onChange={(val) => updateKabupatenGlobalAnomaliesWet(selectedKabupaten, { iodNegatifBerlanjut: val })}
              label="Status IOD Negatif Berlanjut"
            />
          </CardContent>
        </Card>
      </div>
    </CombinedKabupatenSidebar>
  );
};

// Kecamatan Content
const KecamatanAnomalyWetContent: React.FC = () => {
  const { kecamatanData, selectedKecamatan, updateKecamatanGlobalAnomaliesWet } = useCombinedStore();
  const data = kecamatanData[selectedKecamatan]?.globalAnomaliesWet || {
    laNina: 0,
    iodNegatif: 0,
    laNinaBerlanjut: 0,
    iodNegatifBerlanjut: 0,
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
            <CardTitle>La Niña</CardTitle>
            <CardDescription>
              Fenomena pendinginan suhu permukaan laut di Pasifik Tengah dan Timur yang dapat meningkatkan curah hujan di Indonesia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.laNina}
              onChange={(val) => updateKecamatanGlobalAnomaliesWet(selectedKecamatan, { laNina: val })}
              label="Status La Niña"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IOD Negatif</CardTitle>
            <CardDescription>
              Indian Ocean Dipole fase negatif yang umumnya menyebabkan kondisi lebih basah di sebagian wilayah Indonesia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.iodNegatif}
              onChange={(val) => updateKecamatanGlobalAnomaliesWet(selectedKecamatan, { iodNegatif: val })}
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
              onChange={(val) => updateKecamatanGlobalAnomaliesWet(selectedKecamatan, { laNinaBerlanjut: val })}
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
              onChange={(val) => updateKecamatanGlobalAnomaliesWet(selectedKecamatan, { iodNegatifBerlanjut: val })}
              label="Status IOD Negatif Berlanjut"
            />
          </CardContent>
        </Card>
      </div>
    </CombinedKecamatanSidebar>
  );
};

// Main Component with Dual Tabs
export const StepDualAnomaliesWet: React.FC = () => {
  return (
    <DualInputTabs
      title="Anomali Iklim Global - Basah"
      description="Isi data anomali basah untuk Kabupaten dan Kecamatan (terpisah)."
      kabupatenContent={<KabupatenAnomalyWetContent />}
      kecamatanContent={<KecamatanAnomalyWetContent />}
    />
  );
};
