import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Stepper, Step } from '@/components/Stepper';
import { useKecamatanStore, KECAMATAN_LIST } from '@/store/kecamatanStore';
import { StepGlobalAnomaliesDryKec } from '@/components/kecamatan/StepGlobalAnomaliesDryKec';
import { StepGlobalAnomaliesWetKec } from '@/components/kecamatan/StepGlobalAnomaliesWetKec';
import { StepSeasonTogglesKec } from '@/components/kecamatan/StepSeasonTogglesKec';
import { StepHTHKec } from '@/components/kecamatan/StepHTHKec';
import { StepCHSHKec } from '@/components/kecamatan/StepCHSHKec';
import { StepPDKMKec } from '@/components/kecamatan/StepPDKMKec';
import { StepSummaryKec } from '@/components/kecamatan/StepSummaryKec';
import { ChevronLeft, ChevronRight, Download, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { exportToExcelKec } from '@/utils/excelExportKec';

const steps: Step[] = [
  { id: 0, title: 'Anomali Kering', description: 'El Niño, IOD+' },
  { id: 1, title: 'Anomali Basah', description: 'La Niña, IOD-' },
  { id: 2, title: 'Musim', description: 'Kemarau/Hujan' },
  { id: 3, title: 'HTH', description: 'Hari Tanpa Hujan' },
  { id: 4, title: 'CH/SH Bulanan', description: 'Bulan -1' },
  { id: 5, title: 'CH/SH Dasarian', description: 'Bulan 0' },
  { id: 6, title: 'Prediksi +1', description: 'Bulan +1' },
  { id: 7, title: 'Prediksi +2', description: 'Bulan +2' },
  { id: 8, title: 'Prediksi +3', description: 'Bulan +3' },
  { id: 9, title: 'PDKM/PDCHT', description: 'Indikator Final' },
  { id: 10, title: 'Ringkasan', description: 'Export Excel' },
];

const KecamatanWizard: React.FC = () => {
  const { 
    currentStep, 
    completedSteps, 
    setCurrentStep, 
    setCompletedStep, 
    setSelectedKecamatan,
    visitedKecamatanPerStep,
    resetWizard,
    kecamatanData,
    hthData,
    chshMonthly,
    chshDasarian,
    chshPredictionPlus1,
    chshPredictionPlus2,
    chshPredictionPlus3,
  } = useKecamatanStore();
  const [isExporting, setIsExporting] = useState(false);

  // Validasi untuk setiap step
  const validateStep = (step: number): { isValid: boolean; message?: string } => {
    // Using KECAMATAN_LIST from store (78 kecamatan)
    const visitedKec = visitedKecamatanPerStep[step] || [];
    
    // Steps yang membutuhkan kunjungan semua kecamatan (input manual per kecamatan)
    // Note: Step 9 (PDKM) now inputs at kabupaten level, not per kecamatan
    const stepsRequiringAllKecamatan = [0, 1, 2];
    
    // Cek apakah semua kecamatan sudah dikunjungi untuk step yang membutuhkan
    if (stepsRequiringAllKecamatan.includes(step)) {
      const allVisited = KECAMATAN_LIST.every(kec => visitedKec.includes(kec));
      if (!allVisited) {
        const notVisitedCount = KECAMATAN_LIST.filter(kec => !visitedKec.includes(kec)).length;
        return {
          isValid: false,
          message: `Belum semua kecamatan dikunjungi. Masih ada ${notVisitedCount} kecamatan yang belum dikunjungi.`
        };
      }
    }
    
    switch (step) {
      case 0: // Anomali Kering
        const hasAllKecDry = KECAMATAN_LIST.every(kec => 
          kecamatanData[kec]?.globalAnomaliesDry !== undefined
        );
        if (!hasAllKecDry) {
          return { 
            isValid: false, 
            message: 'Silakan isi data Anomali Kering untuk semua kecamatan' 
          };
        }
        return { isValid: true };
        
      case 1: // Anomali Basah
        const hasAllKecWet = KECAMATAN_LIST.every(kec => 
          kecamatanData[kec]?.globalAnomaliesWet !== undefined
        );
        if (!hasAllKecWet) {
          return { 
            isValid: false, 
            message: 'Silakan isi data Anomali Basah untuk semua kecamatan' 
          };
        }
        return { isValid: true };
        
      case 2: // Musim
        const hasAllKecSeason = KECAMATAN_LIST.every(kec => 
          kecamatanData[kec]?.seasonToggles !== undefined
        );
        if (!hasAllKecSeason) {
          return { 
            isValid: false, 
            message: 'Silakan isi data Musim untuk semua kecamatan' 
          };
        }
        return { isValid: true };
        
      case 3: // HTH
        if (!hthData.results || Object.keys(hthData.results).length === 0) {
          return { 
            isValid: false, 
            message: 'Silakan upload file HTH dan klik "Hitung Flag HTH" terlebih dahulu' 
          };
        }
        return { isValid: true };
        
      case 4: // CH/SH Bulanan
        if (!chshMonthly.results || Object.keys(chshMonthly.results).length === 0) {
          return { 
            isValid: false, 
            message: 'Silakan upload file CH dan SH, lalu klik "Hitung Flag CH/SH" terlebih dahulu' 
          };
        }
        return { isValid: true };
        
      case 5: // CH/SH Dasarian
        if (!chshDasarian.results || Object.keys(chshDasarian.results).length === 0) {
          return { 
            isValid: false, 
            message: 'Silakan upload file CH dan SH, lalu klik "Hitung Flag CH/SH" terlebih dahulu' 
          };
        }
        return { isValid: true };
        
      case 6: // Prediksi +1
        if (!chshPredictionPlus1.results || Object.keys(chshPredictionPlus1.results).length === 0) {
          return { 
            isValid: false, 
            message: 'Silakan upload file CH dan SH, lalu klik "Hitung Flag CH/SH" terlebih dahulu' 
          };
        }
        return { isValid: true };
        
      case 7: // Prediksi +2
        if (!chshPredictionPlus2.results || Object.keys(chshPredictionPlus2.results).length === 0) {
          return { 
            isValid: false, 
            message: 'Silakan upload file CH dan SH, lalu klik "Hitung Flag CH/SH" terlebih dahulu' 
          };
        }
        return { isValid: true };
        
      case 8: // Prediksi +3
        if (!chshPredictionPlus3.results || Object.keys(chshPredictionPlus3.results).length === 0) {
          return { 
            isValid: false, 
            message: 'Silakan upload file CH dan SH, lalu klik "Hitung Flag CH/SH" terlebih dahulu' 
          };
        }
        return { isValid: true };
        
      case 9: // PDKM/PDCHT (input per kabupaten, applied to all kecamatan)
        // Check if at least one kecamatan has PDKM data (meaning kabupaten was filled)
        const hasAnyPDKM = KECAMATAN_LIST.some(kec => 
          kecamatanData[kec]?.pdkm !== undefined
        );
        if (!hasAnyPDKM) {
          return { 
            isValid: false, 
            message: 'Silakan isi data PDKM & PDCHT untuk semua kabupaten' 
          };
        }
        return { isValid: true };
        
      default:
        return { isValid: true };
    }
  };

  const handleNext = () => {
    // Validasi step saat ini
    const validation = validateStep(currentStep);
    
    if (!validation.isValid) {
      toast({
        title: 'Data Belum Lengkap',
        description: validation.message || 'Silakan lengkapi data terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    if (currentStep < steps.length - 1) {
      setCompletedStep(currentStep);
      setCurrentStep(currentStep + 1);
      // Reset ke kecamatan pertama saat pindah step
      setSelectedKecamatan(KECAMATAN_LIST[0]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (stepId: number) => {
    // Allow clicking on completed steps or the next step
    if (completedSteps.includes(stepId) || stepId <= currentStep + 1) {
      setCurrentStep(stepId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToExcelKec();
      toast({
        title: 'Export Berhasil',
        description: 'File Excel berhasil diunduh',
      });
    } catch (error) {
      toast({
        title: 'Export Gagal',
        description: 'Terjadi kesalahan saat export ke Excel',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin mereset semua data? Ini akan menghapus semua input Anda.')) {
      resetWizard();
      toast({
        title: 'Data Direset',
        description: 'Semua data input telah dihapus',
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <StepGlobalAnomaliesDryKec />;
      case 1:
        return <StepGlobalAnomaliesWetKec />;
      case 2:
        return <StepSeasonTogglesKec />;
      case 3:
        return <StepHTHKec />;
      case 4:
        return (
          <StepCHSHKec
            period="monthly"
            title="CH/SH Bulanan (Bulan -1)"
            description="Upload data CH dan SH untuk bulan sebelumnya (monitoring iklim regional)"
          />
        );
      case 5:
        return (
          <StepCHSHKec
            period="dasarian"
            title="CH/SH Dasarian (Bulan Berjalan)"
            description="Upload data CH dan SH dasarian untuk bulan berjalan"
          />
        );
      case 6:
        return (
          <StepCHSHKec
            period="plus1"
            title="Prediksi CH/SH Bulan +1"
            description="Upload data prediksi CH dan SH untuk bulan +1"
          />
        );
      case 7:
        return (
          <StepCHSHKec
            period="plus2"
            title="Prediksi CH/SH Bulan +2"
            description="Upload data prediksi CH dan SH untuk bulan +2"
          />
        );
      case 8:
        return (
          <StepCHSHKec
            period="plus3"
            title="Prediksi CH/SH Bulan +3"
            description="Upload data prediksi CH dan SH untuk bulan +3"
          />
        );
      case 9:
        return <StepPDKMKec />;
      case 10:
        return <StepSummaryKec />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Input Data SKPG Kecamatan</h1>
              <p className="text-muted-foreground mt-2">
                Ikuti langkah-langkah berikut untuk melengkapi data SKPG
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Stepper */}
          <Card className="p-6">
            <Stepper
              steps={steps}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={handleStepClick}
            />
          </Card>

          {/* Step Content */}
          <Card className="p-8">
            {renderStepContent()}
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Sebelumnya
            </Button>

            <div className="flex gap-3">
              {currentStep < steps.length - 1 && (
                <Button
                  onClick={handleNext}
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Progress Info */}
          <div className="text-center text-sm text-muted-foreground">
            Step {currentStep + 1} dari {steps.length} •{' '}
            {completedSteps.length} langkah selesai
          </div>
        </div>
      </main>
    </div>
  );
};

export default KecamatanWizard;

