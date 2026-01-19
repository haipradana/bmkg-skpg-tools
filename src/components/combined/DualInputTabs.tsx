import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCombinedStore, InputLevel } from '@/store/combinedStore';
import { KABUPATEN_LIST } from '@/store/wizardStore';
import { KECAMATAN_LIST } from '@/store/kecamatanStore';
import { cn } from '@/lib/utils';

interface DualInputTabsProps {
  kabupatenContent: React.ReactNode;
  kecamatanContent: React.ReactNode;
  title: string;
  description: string;
}

export const DualInputTabs: React.FC<DualInputTabsProps> = ({
  kabupatenContent,
  kecamatanContent,
  title,
  description,
}) => {
  const { 
    currentStep,
    activeInputLevel, 
    setActiveInputLevel,
    visitedKabupatenPerStep,
    visitedKecamatanPerStep,
  } = useCombinedStore();

  const visitedKab = visitedKabupatenPerStep[currentStep] || [];
  const visitedKec = visitedKecamatanPerStep[currentStep] || [];
  
  const kabCompleted = KABUPATEN_LIST.every(k => visitedKab.includes(k));
  const kecCompleted = KECAMATAN_LIST.every(k => visitedKec.includes(k));

  const handleTabChange = (value: string) => {
    setActiveInputLevel(value as InputLevel);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      {/* Instruction Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Petunjuk:</strong> Anda perlu mengisi data untuk <strong>Kabupaten</strong> dan <strong>Kecamatan</strong> secara terpisah. 
          Gunakan tab di bawah untuk beralih. Kedua tab harus diselesaikan sebelum melanjutkan ke langkah berikutnya.
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs value={activeInputLevel} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-6 h-auto p-1">
          {/* Kabupaten Tab */}
          <TabsTrigger 
            value="kabupaten" 
            className={cn(
              "flex items-center gap-2 py-3 relative",
              kabCompleted && "data-[state=inactive]:bg-green-50",
              "data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 data-[state=active]:shadow-md"
            )}
          >
            {kabCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            <span className="font-medium">Kabupaten</span>
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full ml-1",
              kabCompleted 
                ? "bg-green-100 text-green-700" 
                : "bg-muted text-muted-foreground"
            )}>
              {visitedKab.length}/{KABUPATEN_LIST.length}
            </span>
          </TabsTrigger>

          {/* Kecamatan Tab */}
          <TabsTrigger 
            value="kecamatan" 
            className={cn(
              "flex items-center gap-2 py-3 relative",
              kecCompleted && "data-[state=inactive]:bg-green-50",
              "data-[state=active]:bg-teal-100 data-[state=active]:text-teal-900 data-[state=active]:shadow-md"
            )}
          >
            {kecCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            <span className="font-medium">Kecamatan</span>
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full ml-1",
              kecCompleted 
                ? "bg-green-100 text-green-700" 
                : "bg-muted text-muted-foreground"
            )}>
              {visitedKec.length}/{KECAMATAN_LIST.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Content */}
        <TabsContent value="kabupaten" className="mt-0">
          <div className={cn(
            "rounded-lg border-2 p-4",
            "border-amber-200 bg-amber-50/30"
          )}>
            {kabupatenContent}
          </div>
        </TabsContent>

        <TabsContent value="kecamatan" className="mt-0">
          <div className={cn(
            "rounded-lg border-2 p-4",
            "border-teal-200 bg-teal-50/30"
          )}>
            {kecamatanContent}
          </div>
        </TabsContent>
      </Tabs>

      {/* Completion Status */}
      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          <div className={cn(
            "w-3 h-3 rounded-full",
            kabCompleted ? "bg-green-500" : "bg-amber-400"
          )} />
          <span className="text-sm">
            Kabupaten: {kabCompleted ? "Selesai ✓" : `${visitedKab.length}/${KABUPATEN_LIST.length}`}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <div className={cn(
            "w-3 h-3 rounded-full",
            kecCompleted ? "bg-green-500" : "bg-teal-400"
          )} />
          <span className="text-sm">
            Kecamatan: {kecCompleted ? "Selesai ✓" : `${visitedKec.length}/${KECAMATAN_LIST.length}`}
          </span>
        </div>
        {kabCompleted && kecCompleted && (
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Langkah ini selesai!</span>
          </div>
        )}
      </div>
    </div>
  );
};
