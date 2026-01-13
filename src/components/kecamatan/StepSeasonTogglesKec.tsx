import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SegmentedControl } from '../wizard/SegmentedControl';
import { useKecamatanStore, getKecamatanFromKey } from '@/store/kecamatanStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { KecamatanSidebar } from './KecamatanSidebar';

export const StepSeasonTogglesKec: React.FC = () => {
  const { kecamatanData, selectedKecamatan, updateSeasonToggles } = useKecamatanStore();
  const data = kecamatanData[selectedKecamatan]?.seasonToggles || {
    musimKemarau: 0,
    bulanPlus1MusimKemarau: 0,
    musimHujan: 1,
    bulanPlus1MusimHujan: 1,
  };

  return (
    <KecamatanSidebar
      title="Musim Saat Ini"
      description="Isi data musim untuk setiap kecamatan"
    >
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Sistem akan otomatis menghitung nilai kebalikan untuk Musim Hujan (inverse dari Musim Kemarau).
          <strong className="block mt-1">Data untuk: {getKecamatanFromKey(selectedKecamatan)}</strong>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Musim Kemarau</CardTitle>
            <CardDescription>
              Apakah saat ini sedang musim kemarau? (1 = Ya, 0 = Tidak)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SegmentedControl
              value={data.musimKemarau}
              onChange={(val) => updateSeasonToggles(selectedKecamatan, { musimKemarau: val })}
              label="Status Musim Kemarau"
            />
            
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Musim Hujan (auto):</strong>{' '}
                <span className="font-mono">{data.musimHujan}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bulan +1 Musim Kemarau</CardTitle>
            <CardDescription>
              Apakah bulan depan diprediksi masih musim kemarau? (1 = Ya, 0 = Tidak)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SegmentedControl
              value={data.bulanPlus1MusimKemarau}
              onChange={(val) => updateSeasonToggles(selectedKecamatan, { bulanPlus1MusimKemarau: val })}
              label="Status Bulan +1 Musim Kemarau"
            />
            
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Bulan +1 Musim Hujan (auto):</strong>{' '}
                <span className="font-mono">{data.bulanPlus1MusimHujan}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </KecamatanSidebar>
  );
};
