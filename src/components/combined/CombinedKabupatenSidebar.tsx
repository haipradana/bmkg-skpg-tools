import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle, ChevronRight, Building2 } from 'lucide-react';
import { useCombinedStore } from '@/store/combinedStore';
import { KABUPATEN_LIST, KabupatenName } from '@/store/wizardStore';
import { cn } from '@/lib/utils';

interface CombinedKabupatenSidebarProps {
  children: React.ReactNode;
}

export const CombinedKabupatenSidebar: React.FC<CombinedKabupatenSidebarProps> = ({
  children,
}) => {
  const { 
    currentStep, 
    selectedKabupaten, 
    setSelectedKabupaten, 
    visitedKabupatenPerStep,
    markKabupatenVisited 
  } = useCombinedStore();

  const visitedKabupaten = visitedKabupatenPerStep[currentStep] || [];
  
  // Mark the initial kabupaten as visited when component mounts
  useEffect(() => {
    markKabupatenVisited(currentStep, selectedKabupaten);
  }, [currentStep, selectedKabupaten, markKabupatenVisited]);
  
  const handleKabupatenClick = (kab: KabupatenName) => {
    setSelectedKabupaten(kab);
    markKabupatenVisited(currentStep, kab);
  };

  const handleNextKabupaten = () => {
    const currentIndex = KABUPATEN_LIST.indexOf(selectedKabupaten);
    if (currentIndex < KABUPATEN_LIST.length - 1) {
      const nextKab = KABUPATEN_LIST[currentIndex + 1];
      handleKabupatenClick(nextKab);
    }
  };

  const isAllVisited = KABUPATEN_LIST.every(kab => visitedKabupaten.includes(kab));
  const currentIndex = KABUPATEN_LIST.indexOf(selectedKabupaten);
  const hasNextKabupaten = currentIndex < KABUPATEN_LIST.length - 1;

  return (
    <div className="flex gap-6">
      {/* Vertical Kabupaten Sidebar */}
      <div className="w-56 shrink-0">
        <Card className="sticky top-4 border-amber-200">
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-200">
                <Building2 className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">
                  Pilih Kabupaten
                </span>
              </div>
              
              {KABUPATEN_LIST.map((kab, index) => {
                const isVisited = visitedKabupaten.includes(kab);
                const isSelected = selectedKabupaten === kab;
                
                return (
                  <button
                    key={kab}
                    onClick={() => handleKabupatenClick(kab)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                      isSelected 
                        ? "bg-amber-500 text-white shadow-md" 
                        : isVisited
                          ? "bg-green-50 hover:bg-green-100 text-green-800"
                          : "hover:bg-amber-50 text-foreground"
                    )}
                  >
                    <div className="shrink-0">
                      {isVisited ? (
                        <CheckCircle2 className={cn(
                          "h-5 w-5",
                          isSelected ? "text-white" : "text-green-600"
                        )} />
                      ) : (
                        <Circle className={cn(
                          "h-5 w-5",
                          isSelected ? "text-white/70" : "text-muted-foreground"
                        )} />
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-medium truncate",
                      isSelected ? "text-white" : ""
                    )}>
                      {index + 1}. {kab}
                    </span>
                    {isSelected && (
                      <ChevronRight className="h-4 w-4 ml-auto shrink-0 text-white/70" />
                    )}
                  </button>
                );
              })}
              
              {/* Progress indicator */}
              <div className="mt-4 pt-3 border-t border-amber-200">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span>{visitedKabupaten.length}/{KABUPATEN_LIST.length}</span>
                </div>
                <div className="w-full bg-amber-100 rounded-full h-2">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      isAllVisited ? "bg-green-500" : "bg-amber-500"
                    )}
                    style={{ width: `${(visitedKabupaten.length / KABUPATEN_LIST.length) * 100}%` }}
                  />
                </div>
                {isAllVisited && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Semua kabupaten sudah dikunjungi
                  </p>
                )}
              </div>
              
              {/* Next Kabupaten Button */}
              {hasNextKabupaten && (
                <Button
                  onClick={handleNextKabupaten}
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                >
                  Kabupaten Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
};
