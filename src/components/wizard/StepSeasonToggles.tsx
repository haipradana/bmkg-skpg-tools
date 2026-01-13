import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SegmentedControl } from './SegmentedControl';
import { useWizardStore } from '@/store/wizardStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { KabupatenSidebar } from './KabupatenSidebar';

export const StepSeasonToggles: React.FC = () => {
  const { kabupatenData, selectedKabupaten, updateSeasonToggles } = useWizardStore();
  const data = kabupatenData[selectedKabupaten].seasonToggles;

  return (
    <KabupatenSidebar
      title="Musim Saat Ini"
      description="Isi data musim untuk setiap kabupaten"
    >
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Sistem akan otomatis menghitung nilai kebalikan untuk Musim Hujan (inverse dari Musim Kemarau).
          <strong className="block mt-1">Data untuk: {selectedKabupaten}</strong>
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
              onChange={(val) => updateSeasonToggles(selectedKabupaten, { musimKemarau: val })}
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
              onChange={(val) => updateSeasonToggles(selectedKabupaten, { bulanPlus1MusimKemarau: val })}
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
    </KabupatenSidebar>
  );
};
