import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SegmentedControl } from '@/components/wizard/SegmentedControl';
import { useCombinedStore } from '@/store/combinedStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { CombinedKabupatenSidebar } from './CombinedKabupatenSidebar';
import { KECAMATAN_BY_KABUPATEN, createKecamatanKey } from '@/store/kecamatanStore';

// Content component for kabupaten input
const KabupatenAnomalyWetContent: React.FC = () => {
  const { 
    kabupatenData, 
    selectedKabupaten, 
    updateKabupatenGlobalAnomaliesWet,
    updateKecamatanGlobalAnomaliesWet 
  } = useCombinedStore();
  
  const data = kabupatenData[selectedKabupaten].globalAnomaliesWet;

  // Update kabupaten AND all its kecamatan
  const handleUpdate = (field: keyof typeof data, value: 0 | 1) => {
    // Update kabupaten
    updateKabupatenGlobalAnomaliesWet(selectedKabupaten, { [field]: value });
    
    // Auto-fill: Update all kecamatan in this kabupaten
    const kecamatanList = KECAMATAN_BY_KABUPATEN[selectedKabupaten as keyof typeof KECAMATAN_BY_KABUPATEN];
    if (kecamatanList) {
      kecamatanList.forEach((kec) => {
        const kecKey = createKecamatanKey(selectedKabupaten, kec);
        updateKecamatanGlobalAnomaliesWet(kecKey, { [field]: value });
      });
    }
  };

  // Get kecamatan count
  const kecCount = KECAMATAN_BY_KABUPATEN[selectedKabupaten as keyof typeof KECAMATAN_BY_KABUPATEN]?.length || 0;

  return (
    <CombinedKabupatenSidebar>
      <Alert className="mb-6 bg-teal-50 border-teal-200">
        <Info className="h-4 w-4 text-teal-600" />
        <AlertDescription className="text-teal-800">
          Pilih <strong>1</strong> jika kondisi aktif/terjadi, pilih <strong>0</strong> jika tidak.
          <strong className="block mt-1">Data untuk: {selectedKabupaten}</strong>
          <span className="text-xs text-teal-600 block mt-1">
            → Nilai akan otomatis diterapkan ke {kecCount} kecamatan dalam kabupaten ini
          </span>
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
              onChange={(val) => handleUpdate('laNina', val)}
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
              onChange={(val) => handleUpdate('iodNegatif', val)}
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
              onChange={(val) => handleUpdate('laNinaBerlanjut', val)}
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
              onChange={(val) => handleUpdate('iodNegatifBerlanjut', val)}
              label="Status IOD Negatif Berlanjut"
            />
          </CardContent>
        </Card>
      </div>
    </CombinedKabupatenSidebar>
  );
};

// Main Component - Kabupaten only (no dual tabs)
export const StepDualAnomaliesWet: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Anomali Iklim Global - Basah</h2>
        <p className="text-muted-foreground mt-2">
          Isi data anomali basah untuk setiap Kabupaten. Nilai akan otomatis diterapkan ke semua kecamatan dalam kabupaten tersebut.
        </p>
      </div>

      {/* Kabupaten Content with Sidebar */}
      <KabupatenAnomalyWetContent />
    </div>
  );
};
