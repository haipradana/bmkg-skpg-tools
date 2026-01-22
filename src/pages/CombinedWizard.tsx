import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Stepper, Step } from '@/components/Stepper';
import { useCombinedStore } from '@/store/combinedStore';
import { KABUPATEN_LIST } from '@/store/wizardStore';
import { KECAMATAN_LIST } from '@/store/kecamatanStore';
import { StepDualAnomaliesDry } from '@/components/combined/StepDualAnomaliesDry';
import { StepDualAnomaliesWet } from '@/components/combined/StepDualAnomaliesWet';
import { StepDualSeasonToggles } from '@/components/combined/StepDualSeasonToggles';
import { StepCombinedHTH } from '@/components/combined/StepCombinedHTH';
import { StepCombinedCHSH } from '@/components/combined/StepCombinedCHSH';
import { StepPDKM } from '@/components/wizard/StepPDKM';
import { StepCombinedSummary } from '@/components/combined/StepCombinedSummary';
import { ChevronLeft, ChevronRight, RotateCcw, Layers } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const steps: Step[] = [
  { id: 0, title: 'Anomali Kering', description: 'El Niño, IOD+ (per Kab)' },
  { id: 1, title: 'Anomali Basah', description: 'La Niña, IOD- (per Kab)' },
  { id: 2, title: 'Musim', description: 'Kemarau/Hujan (per Kab)' },
  { id: 3, title: 'HTH', description: 'Hari Tanpa Hujan' },
  { id: 4, title: 'CH/SH Bulanan', description: 'Bulan -1' },
  { id: 5, title: 'CH/SH Dasarian', description: 'Bulan 0' },
  { id: 6, title: 'Prediksi +1', description: 'Bulan +1' },
  { id: 7, title: 'Prediksi +2', description: 'Bulan +2' },
  { id: 8, title: 'Prediksi +3', description: 'Bulan +3' },
  { id: 9, title: 'PDKM/PDCHT', description: 'Per Kabupaten' },
  { id: 10, title: 'Ringkasan', description: 'Export 2 Excel' },
];

const CombinedWizard: React.FC = () => {
  const { 
    currentStep, 
    completedSteps, 
    setCurrentStep, 
    setCompletedStep, 
    setSelectedKabupaten,
    setSelectedKecamatan,
    setActiveInputLevel,
    visitedKabupatenPerStep,
    visitedKecamatanPerStep,
    resetWizard,
    kabupatenData,
    kecamatanData,
    hthData,
    chshMonthly,
    chshDasarian,
    chshPredictionPlus1,
    chshPredictionPlus2,
    chshPredictionPlus3,
  } = useCombinedStore();

  // Validasi untuk setiap step
  const validateStep = (step: number): { isValid: boolean; message?: string } => {
    // Steps 0-2: Kabupaten-only input (kecamatan auto-filled from kabupaten)
    // No validation needed - all kabupaten cards are visible and input is applied automatically
    if (step <= 2) {
      return { isValid: true };
    }
    
    // Existing validation for other steps
    switch (step) {
      case 3: // HTH
        if (!hthData.resultsKabupaten || !hthData.resultsKecamatan) {
          return { 
            isValid: false, 
            message: 'Silakan upload file HTH dan klik "Hitung Flag HTH" terlebih dahulu' 
          };
        }
        return { isValid: true };
        
      case 4: // CH/SH Bulanan
        if (!chshMonthly.resultsKabupaten || !chshMonthly.resultsKecamatan) {
          return { 
            isValid: false, 
            message: 'Silakan upload file CH dan SH, lalu klik "Hitung Flag CH/SH" terlebih dahulu' 
          };
        }
        return { isValid: true };
        
      case 5: // CH/SH Dasarian
        if (!chshDasarian.resultsKabupaten || !chshDasarian.resultsKecamatan) {
          return { 
            isValid: false, 
            message: 'Silakan upload file CH dan SH, lalu klik "Hitung Flag CH/SH" terlebih dahulu' 
          };
        }
        return { isValid: true };
        
      case 6: // Prediksi +1
        if (!chshPredictionPlus1.resultsKabupaten || !chshPredictionPlus1.resultsKecamatan) {
          return { 
            isValid: false, 
            message: 'Silakan upload file CH dan SH, lalu klik "Hitung Flag CH/SH" terlebih dahulu' 
          };
        }
        return { isValid: true };
        
      case 7: // Prediksi +2
        if (!chshPredictionPlus2.resultsKabupaten || !chshPredictionPlus2.resultsKecamatan) {
          return { 
            isValid: false, 
            message: 'Silakan upload file CH dan SH, lalu klik "Hitung Flag CH/SH" terlebih dahulu' 
          };
        }
        return { isValid: true };
        
      case 8: // Prediksi +3
        if (!chshPredictionPlus3.resultsKabupaten || !chshPredictionPlus3.resultsKecamatan) {
          return { 
            isValid: false, 
            message: 'Silakan upload file CH dan SH, lalu klik "Hitung Flag CH/SH" terlebih dahulu' 
          };
        }
        return { isValid: true };
        
      case 9: // PDKM - all kabupaten must have pdkm data
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
      // Reset selections when moving to next step
      setSelectedKabupaten('Sleman');
      setSelectedKecamatan(KECAMATAN_LIST[0]);
      setActiveInputLevel('kabupaten');
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
    if (completedSteps.includes(stepId) || stepId <= currentStep + 1) {
      setCurrentStep(stepId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        return <StepDualAnomaliesDry />;
      case 1:
        return <StepDualAnomaliesWet />;
      case 2:
        return <StepDualSeasonToggles />;
      case 3:
        return <StepCombinedHTH />;
      case 4:
        return (
          <StepCombinedCHSH
            period="monthly"
            title="CH/SH Bulanan (Bulan -1)"
            description="Upload data CH dan SH untuk bulan sebelumnya (monitoring iklim regional)"
          />
        );
      case 5:
        return (
          <StepCombinedCHSH
            period="dasarian"
            title="CH/SH Dasarian (Bulan Berjalan)"
            description="Upload data CH dan SH dasarian untuk bulan berjalan"
          />
        );
      case 6:
        return (
          <StepCombinedCHSH
            period="plus1"
            title="Prediksi CH/SH Bulan +1"
            description="Upload data prediksi CH dan SH untuk bulan +1"
          />
        );
      case 7:
        return (
          <StepCombinedCHSH
            period="plus2"
            title="Prediksi CH/SH Bulan +2"
            description="Upload data prediksi CH dan SH untuk bulan +2"
          />
        );
      case 8:
        return (
          <StepCombinedCHSH
            period="plus3"
            title="Prediksi CH/SH Bulan +3"
            description="Upload data prediksi CH dan SH untuk bulan +3"
          />
        );
      case 9:
        // TODO: Create StepCombinedPDKM
        return <StepPDKM />;
      case 10:
        return <StepCombinedSummary />;
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
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-teal-100">
                  <Layers className="h-6 w-6 text-amber-600" />
                </div>
                <h1 className="text-3xl font-bold">Input Data SKPG Lengkap</h1>
              </div>
              <p className="text-muted-foreground mt-2">
                Isi data Kabupaten <strong className="text-amber-600">DAN</strong> Kecamatan sekaligus → Export 2 file Excel
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/">Kembali</Link>
              </Button>
              <Button variant="destructive" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
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
                <Button onClick={handleNext}>
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

export default CombinedWizard;
