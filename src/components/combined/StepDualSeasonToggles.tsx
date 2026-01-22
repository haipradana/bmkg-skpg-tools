import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SegmentedControl } from '@/components/wizard/SegmentedControl';
import { useCombinedStore } from '@/store/combinedStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { CombinedKabupatenSidebar } from './CombinedKabupatenSidebar';
import { KECAMATAN_BY_KABUPATEN, createKecamatanKey } from '@/store/kecamatanStore';

// Content component for kabupaten input
const KabupatenSeasonContent: React.FC = () => {
  const { 
    kabupatenData, 
    selectedKabupaten, 
    updateKabupatenSeasonToggles,
    updateKecamatanSeasonToggles 
  } = useCombinedStore();
  
  const data = kabupatenData[selectedKabupaten].seasonToggles;

  // Update kabupaten AND all its kecamatan
  const handleUpdate = (field: 'musimKemarau' | 'bulanPlus1MusimKemarau', value: 0 | 1) => {
    // Update kabupaten (store auto-derives musimHujan values)
    updateKabupatenSeasonToggles(selectedKabupaten, { [field]: value });
    
    // Auto-fill: Update all kecamatan in this kabupaten
    const kecamatanList = KECAMATAN_BY_KABUPATEN[selectedKabupaten as keyof typeof KECAMATAN_BY_KABUPATEN];
    if (kecamatanList) {
      kecamatanList.forEach((kec) => {
        const kecKey = createKecamatanKey(selectedKabupaten, kec);
        updateKecamatanSeasonToggles(kecKey, { [field]: value });
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
          Tentukan musim yang berlaku untuk <strong>{selectedKabupaten}</strong>.
          Nilai musim hujan akan otomatis menjadi kebalikan dari musim kemarau.
          <span className="text-xs text-amber-600 block mt-1">
            → Nilai akan otomatis diterapkan ke {kecCount} kecamatan dalam kabupaten ini
          </span>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Musim Kemarau</CardTitle>
            <CardDescription className="text-orange-600">
              Apakah saat ini sedang musim kemarau di wilayah ini?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.musimKemarau}
              onChange={(val) => handleUpdate('musimKemarau', val)}
              label="Status Musim Kemarau"
            />
            <div className="mt-3 text-sm text-muted-foreground">
              Musim Hujan: <span className="font-semibold">{data.musimHujan === 1 ? '1 (Aktif)' : '0 (Tidak Aktif)'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Bulan +1 Musim Kemarau</CardTitle>
            <CardDescription className="text-orange-600">
              Apakah bulan depan diprediksi masih musim kemarau?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={data.bulanPlus1MusimKemarau}
              onChange={(val) => handleUpdate('bulanPlus1MusimKemarau', val)}
              label="Status Bulan +1 Kemarau"
            />
            <div className="mt-3 text-sm text-muted-foreground">
              Bulan +1 Musim Hujan: <span className="font-semibold">{data.bulanPlus1MusimHujan === 1 ? '1 (Aktif)' : '0 (Tidak Aktif)'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Display derived values */}
      <Card className="mt-6 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="text-green-800">Ringkasan Musim - {selectedKabupaten}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-white rounded-lg">
              <span className="text-muted-foreground">Bulan Ini:</span>
              <p className="font-semibold text-lg">
                {data.musimKemarau === 1 ? '🌞 Kemarau' : '🌧️ Hujan'}
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <span className="text-muted-foreground">Bulan Depan:</span>
              <p className="font-semibold text-lg">
                {data.bulanPlus1MusimKemarau === 1 ? '🌞 Kemarau' : '🌧️ Hujan'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </CombinedKabupatenSidebar>
  );
};

// Main Component - Kabupaten only (no dual tabs)
export const StepDualSeasonToggles: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Musim</h2>
        <p className="text-muted-foreground mt-2">
          Isi data musim untuk setiap Kabupaten. Nilai akan otomatis diterapkan ke semua kecamatan dalam kabupaten tersebut.
        </p>
      </div>

      {/* Kabupaten Content with Sidebar */}
      <KabupatenSeasonContent />
    </div>
  );
};
