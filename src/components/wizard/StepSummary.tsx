import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, CheckCircle2, RotateCcw } from 'lucide-react';
import { KabupatenSummaryTable } from './KabupatenSummaryTable';
import { exportToExcel } from '@/utils/excelExport';
import { useWizardStore } from '@/store/wizardStore';
import { useState } from 'react';

export const StepSummary = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { resetWizard } = useWizardStore();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToExcel();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Gagal mengekspor data. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset semua data? Semua input akan dihapus dan Anda akan kembali ke langkah pertama.')) {
      resetWizard();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-green-800">
                Ringkasan Data & Export
              </CardTitle>
              <p className="text-sm text-green-600 mt-1">
                Semua data telah berhasil diinputkan. Silakan periksa ringkasan dan download file Excel.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Mengekspor...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Export ke Excel
                </>
              )}
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Format: .xlsx dengan styling dan warna</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Table */}
      <KabupatenSummaryTable />

      {/* Reset Button - Bottom Right */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleReset}
          variant="destructive"
          size="lg"
          className="shadow-md"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Reset Semua Data (Mulai Bulan Baru)
        </Button>
      </div>
    </div>
  );
};
