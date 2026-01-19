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
const KabupatenSeasonContent: React.FC = () => {
  const { kabupatenData, selectedKabupaten, updateKabupatenSeasonToggles } = useCombinedStore();
  const data = kabupatenData[selectedKabupaten].seasonToggles;

  return (
    <CombinedKabupatenSidebar>
      <Alert className="mb-6 bg-amber-50 border-amber-200">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Tentukan musim yang berlaku untuk <strong>{selectedKabupaten}</strong>.
          Nilai musim hujan akan otomatis menjadi kebalikan dari musim kemarau.
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
              onChange={(val) => updateKabupatenSeasonToggles(selectedKabupaten, { musimKemarau: val })}
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
              onChange={(val) => updateKabupatenSeasonToggles(selectedKabupaten, { bulanPlus1MusimKemarau: val })}
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

// Kecamatan Content
const KecamatanSeasonContent: React.FC = () => {
  const { kecamatanData, selectedKecamatan, updateKecamatanSeasonToggles } = useCombinedStore();
  const data = kecamatanData[selectedKecamatan]?.seasonToggles || {
    musimKemarau: 0,
    bulanPlus1MusimKemarau: 0,
    musimHujan: 1,
    bulanPlus1MusimHujan: 1,
  };
  const displayName = getKecamatanFromKey(selectedKecamatan);

  return (
    <CombinedKecamatanSidebar>
      <Alert className="mb-6 bg-teal-50 border-teal-200">
        <Info className="h-4 w-4 text-teal-600" />
        <AlertDescription className="text-teal-800">
          Tentukan musim yang berlaku untuk <strong>{displayName}</strong>.
          Nilai musim hujan akan otomatis menjadi kebalikan dari musim kemarau.
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
              onChange={(val) => updateKecamatanSeasonToggles(selectedKecamatan, { musimKemarau: val })}
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
              onChange={(val) => updateKecamatanSeasonToggles(selectedKecamatan, { bulanPlus1MusimKemarau: val })}
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
          <CardTitle className="text-green-800">Ringkasan Musim - {displayName}</CardTitle>
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
    </CombinedKecamatanSidebar>
  );
};

// Main Component with Dual Tabs
export const StepDualSeasonToggles: React.FC = () => {
  return (
    <DualInputTabs
      title="Musim"
      description="Isi data musim untuk Kabupaten dan Kecamatan (terpisah)."
      kabupatenContent={<KabupatenSeasonContent />}
      kecamatanContent={<KecamatanSeasonContent />}
    />
  );
};
