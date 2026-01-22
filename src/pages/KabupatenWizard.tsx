import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Stepper, Step } from '@/components/Stepper';
import { useWizardStore, KABUPATEN_LIST } from '@/store/wizardStore';
import { StepGlobalAnomaliesDry } from '@/components/wizard/StepGlobalAnomaliesDry';
import { StepGlobalAnomaliesWet } from '@/components/wizard/StepGlobalAnomaliesWet';
import { StepSeasonToggles } from '@/components/wizard/StepSeasonToggles';
import { StepHTH } from '@/components/wizard/StepHTH';
import { StepCHSH } from '@/components/wizard/StepCHSH';
import { StepPDKM } from '@/components/wizard/StepPDKM';
import { StepSummary } from '@/components/wizard/StepSummary';
import { ChevronLeft, ChevronRight, Download, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { exportToExcel } from '@/utils/excelExport';

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

const KabupatenWizard: React.FC = () => {
  const { 
    currentStep, 
    completedSteps, 
    setCurrentStep, 
    setCompletedStep, 
    setSelectedKabupaten,
    visitedKabupatenPerStep,
    resetWizard,
    kabupatenData,
    hthData,
    chshMonthly,
    chshDasarian,
    chshPredictionPlus1,
    chshPredictionPlus2,
    chshPredictionPlus3,
  } = useWizardStore();
  const [isExporting, setIsExporting] = useState(false);

  // Validasi untuk setiap step
  const validateStep = (step: number): { isValid: boolean; message?: string } => {
    const visitedKab = visitedKabupatenPerStep[step] || [];
    
    // Steps yang membutuhkan kunjungan semua kabupaten (input manual per kabupaten)
    const stepsRequiringAllKabupaten = [0, 1, 2, 9];
    
    // Cek apakah semua kabupaten sudah dikunjungi untuk step yang membutuhkan
    if (stepsRequiringAllKabupaten.includes(step)) {
      const allVisited = KABUPATEN_LIST.every(kab => visitedKab.includes(kab));
      if (!allVisited) {
        const notVisited = KABUPATEN_LIST.filter(kab => !visitedKab.includes(kab));
        return {
          isValid: false,
          message: `Belum semua kabupaten dikunjungi. Silakan klik kabupaten berikut: ${notVisited.join(', ')}`
        };
      }
    }
    
    switch (step) {
      case 0: // Anomali Kering
        const hasAllKabDry = KABUPATEN_LIST.every(kab => 
          kabupatenData[kab]?.globalAnomaliesDry !== undefined
        );
        if (!hasAllKabDry) {
          return { 
            isValid: false, 
            message: 'Silakan isi data Anomali Kering untuk semua kabupaten' 
          };
        }
        return { isValid: true };
        
      case 1: // Anomali Basah
        const hasAllKabWet = KABUPATEN_LIST.every(kab => 
          kabupatenData[kab]?.globalAnomaliesWet !== undefined
        );
        if (!hasAllKabWet) {
          return { 
            isValid: false, 
            message: 'Silakan isi data Anomali Basah untuk semua kabupaten' 
          };
        }
        return { isValid: true };
        
      case 2: // Musim
        const hasAllKabSeason = KABUPATEN_LIST.every(kab => 
          kabupatenData[kab]?.seasonToggles !== undefined
        );
        if (!hasAllKabSeason) {
          return { 
            isValid: false, 
            message: 'Silakan isi data Musim untuk semua kabupaten' 
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
        
      case 9: // PDKM/PDCHT
        const hasAllKabPDKM = KABUPATEN_LIST.every(kab => 
          kabupatenData[kab]?.pdkm !== undefined
        );
        if (!hasAllKabPDKM) {
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
      // Reset ke kabupaten pertama saat pindah step
      setSelectedKabupaten('Sleman');
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
      await exportToExcel();
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
        return <StepGlobalAnomaliesDry />;
      case 1:
        return <StepGlobalAnomaliesWet />;
      case 2:
        return <StepSeasonToggles />;
      case 3:
        return <StepHTH />;
      case 4:
        return (
          <StepCHSH
            period="monthly"
            title="Analisis CH/SH Bulanan (Bulan -1)"
            description="Upload data CH dan SH untuk bulan sebelumnya (monitoring iklim regional)"
          />
        );
      case 5:
        return (
          <StepCHSH
            period="dasarian"
            title="CH/SH Dasarian (Bulan Berjalan)"
            description="Upload data CH dan SH dasarian untuk bulan berjalan"
          />
        );
      case 6:
        return (
          <StepCHSH
            period="plus1"
            title="Prediksi CH/SH Bulan +1"
            description="Upload data prediksi CH dan SH untuk bulan +1"
          />
        );
      case 7:
        return (
          <StepCHSH
            period="plus2"
            title="Prediksi CH/SH Bulan +2"
            description="Upload data prediksi CH dan SH untuk bulan +2"
          />
        );
      case 8:
        return (
          <StepCHSH
            period="plus3"
            title="Prediksi CH/SH Bulan +3"
            description="Upload data prediksi CH dan SH untuk bulan +3"
          />
        );
      case 9:
        return <StepPDKM />;
      case 10:
        return <StepSummary />;
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
              <h1 className="text-3xl font-bold">Input Data SKPG Kabupaten</h1>
              <p className="text-muted-foreground mt-2">
                Ikuti langkah-langkah berikut untuk melengkapi data SKPG
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleReset}>
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

export default KabupatenWizard;

