import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SegmentedControl } from '@/components/wizard/SegmentedControl';
import { useCombinedStore } from '@/store/combinedStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { CombinedKabupatenSidebar } from './CombinedKabupatenSidebar';
import { KECAMATAN_BY_KABUPATEN, createKecamatanKey } from '@/store/kecamatanStore';

// Content component for kabupaten input
const KabupatenAnomalyDryContent: React.FC = () => {
  const { 
    kabupatenData, 
    selectedKabupaten, 
    updateKabupatenGlobalAnomaliesDry,
    updateKecamatanGlobalAnomaliesDry 
  } = useCombinedStore();
  
  const data = kabupatenData[selectedKabupaten].globalAnomaliesDry;

  // Update kabupaten AND all its kecamatan
  const handleUpdate = (field: keyof typeof data, value: 0 | 1) => {
    // Update kabupaten
    updateKabupatenGlobalAnomaliesDry(selectedKabupaten, { [field]: value });
    
    // Auto-fill: Update all kecamatan in this kabupaten
    const kecamatanList = KECAMATAN_BY_KABUPATEN[selectedKabupaten as keyof typeof KECAMATAN_BY_KABUPATEN];
    if (kecamatanList) {
      kecamatanList.forEach((kec) => {
        const kecKey = createKecamatanKey(selectedKabupaten, kec);
        updateKecamatanGlobalAnomaliesDry(kecKey, { [field]: value });
      });
    }
  };

  // Get kecamatan count
  const kecCount = KECAMATAN_BY_KABUPATEN[selectedKabupaten as keyof typeof KECAMATAN_BY_KABUPATEN]?.length || 0;

  return (
    <CombinedKabupatenSidebar>
      <Alert className="mb-6 bg-amber-50 border-amber-200">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Pilih <strong>1</strong> jika kondisi aktif/terjadi, pilih <strong>0</strong> jika tidak.
          <strong className="block mt-1">Data untuk: {selectedKabupaten}</strong>
          <span className="text-xs text-amber-600 block mt-1">
            → Nilai akan otomatis diterapkan ke {kecCount} kecamatan dalam kabupaten ini
          </span>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>El Niño</CardTitle>
            <CardDescription>
               Jika anomali suhu permukaan laut wilayah Pasifik Tengah Ekuator positif (lebih panas dari rata-ratanya)            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.elNino}
              onChange={(val) => handleUpdate('elNino', val)}
              label="Status El Niño"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IOD Positif</CardTitle>
            <CardDescription>
              Indian Ocean Dipole positif berdampak pada berkurangnya curah hujan di Indonesia terutama di bagian barat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.iodPositif}
              onChange={(val) => handleUpdate('iodPositif', val)}
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
              onChange={(val) => handleUpdate('elNinoBerlanjut', val)}
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
              onChange={(val) => handleUpdate('iodPositifBerlanjut', val)}
              label="Status IOD Positif Berlanjut"
            />
          </CardContent>
        </Card>
      </div>
    </CombinedKabupatenSidebar>
  );
};

// Main Component - Kabupaten only (no dual tabs)
export const StepDualAnomaliesDry: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Anomali Iklim Global - Kering</h2>
        <p className="text-muted-foreground mt-2">
          Isi data anomali kering untuk setiap Kabupaten. Nilai akan otomatis diterapkan ke semua kecamatan dalam kabupaten tersebut.
        </p>
      </div>

      {/* Kabupaten Content with Sidebar */}
      <KabupatenAnomalyDryContent />
    </div>
  );
};
