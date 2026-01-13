import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SegmentedControl } from '../wizard/SegmentedControl';
import { useKecamatanStore, KECAMATAN_BY_KABUPATEN, createKecamatanKey } from '@/store/kecamatanStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Building2, CheckCircle2 } from 'lucide-react';

// Kabupaten list in order
const KABUPATEN_LIST = ['Bantul', 'Gunungkidul', 'Kota Yogyakarta', 'Kulon Progo', 'Sleman'] as const;

export const StepPDKMKec: React.FC = () => {
  const { kecamatanData, updatePDKM } = useKecamatanStore();
  
  // Get PDKM/PDCHT value for a kabupaten (from first kecamatan in that kabupaten)
  const getKabupatenPDKM = (kabupaten: string) => {
    const kecamatanList = KECAMATAN_BY_KABUPATEN[kabupaten as keyof typeof KECAMATAN_BY_KABUPATEN];
    if (kecamatanList && kecamatanList.length > 0) {
      const firstKec = kecamatanList[0];
      // Use unique key format: Kabupaten_Kecamatan
      const kecKey = createKecamatanKey(kabupaten, firstKec);
      return kecamatanData[kecKey]?.pdkm || { pdkm: 0, pdcht: 0 };
    }
    return { pdkm: 0, pdcht: 0 };
  };

  // Update PDKM for all kecamatan in a kabupaten
  const handleUpdateKabupatenPDKM = (kabupaten: string, field: 'pdkm' | 'pdcht', value: 0 | 1) => {
    const kecamatanList = KECAMATAN_BY_KABUPATEN[kabupaten as keyof typeof KECAMATAN_BY_KABUPATEN];
    if (kecamatanList) {
      kecamatanList.forEach((kec) => {
        // Use unique key format: Kabupaten_Kecamatan
        const kecKey = createKecamatanKey(kabupaten, kec);
        updatePDKM(kecKey, { [field]: value });
      });
    }
  };

  // Count kecamatan per kabupaten
  const getKecCount = (kabupaten: string) => {
    const kecList = KECAMATAN_BY_KABUPATEN[kabupaten as keyof typeof KECAMATAN_BY_KABUPATEN];
    return kecList?.length || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">PDKM & PDCHT</h2>
        <p className="text-muted-foreground mt-2">
          Input data PDKM dan PDCHT per Kabupaten. Nilai akan diterapkan ke semua kecamatan dalam kabupaten tersebut.
        </p>
      </div>

      {/* Alert */}
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Catatan:</strong> Data PDKM dan PDCHT sama untuk semua kecamatan dalam satu kabupaten, 
          sehingga Anda hanya perlu mengisi <strong>5 kabupaten</strong> saja.
        </AlertDescription>
      </Alert>

      {/* Kabupaten Cards */}
      <div className="grid grid-cols-1 gap-6">
        {KABUPATEN_LIST.map((kabupaten) => {
          const data = getKabupatenPDKM(kabupaten);
          const kecCount = getKecCount(kabupaten);
          const isComplete = data.pdkm !== undefined && data.pdcht !== undefined;
          
          return (
            <Card key={kabupaten} className="relative overflow-hidden">
              {/* Success indicator */}
              {isComplete && (
                <div className="absolute top-4 right-4">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              )}
              
              <CardHeader className="pb-4 border-b bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0D73A5] flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{kabupaten}</CardTitle>
                    <CardDescription className="text-sm">
                      {kecCount} kecamatan akan menggunakan nilai ini
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PDKM */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">PDKM (Ada PDKM)</h4>
                      <p className="text-sm text-muted-foreground">
                        Prediksi Dasarian Kumulatif Minimum
                      </p>
                    </div>
                    <SegmentedControl
                      value={(data.pdkm || 0) as 0 | 1}
                      onChange={(val) => handleUpdateKabupatenPDKM(kabupaten, 'pdkm', val)}
                      label="Status PDKM"
                    />
                  </div>

                  {/* PDCHT */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">PDCHT (Ada PDCHT)</h4>
                      <p className="text-sm text-muted-foreground">
                        Prediksi Dasarian Curah Hujan Tinggi
                      </p>
                    </div>
                    <SegmentedControl
                      value={(data.pdcht || 0) as 0 | 1}
                      onChange={(val) => handleUpdateKabupatenPDKM(kabupaten, 'pdcht', val)}
                      label="Status PDCHT"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Total:</strong> 5 kabupaten × 2 indikator = 10 input. 
          Nilai akan otomatis diterapkan ke 78 kecamatan sesuai kabupatennya.
        </p>
      </div>
    </div>
  );
};
