import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle, ChevronRight, ChevronDown, MapPin, Search } from 'lucide-react';
import { useKecamatanStore, KECAMATAN_BY_KABUPATEN, KECAMATAN_LIST, KabupatenKey, getKecamatanFromKey, getKabupatenFromKey, createKecamatanKey } from '@/store/kecamatanStore';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface KecamatanSidebarProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export const KecamatanSidebar: React.FC<KecamatanSidebarProps> = ({
  children,
  title,
  description,
}) => {
  const { 
    currentStep, 
    selectedKecamatan, 
    setSelectedKecamatan, 
    visitedKecamatanPerStep,
    markKecamatanVisited 
  } = useKecamatanStore();

  const [expandedKabupaten, setExpandedKabupaten] = useState<Record<string, boolean>>({
    'Bantul': true,
    'Sleman': false,
    'Gunungkidul': false,
    'Kulon Progo': false,
    'Kota Yogyakarta': false,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const visitedKecamatan = visitedKecamatanPerStep[currentStep] || [];
  
  // Mark the initial kecamatan as visited when component mounts
  useEffect(() => {
    markKecamatanVisited(currentStep, selectedKecamatan);
  }, [currentStep, selectedKecamatan, markKecamatanVisited]);

  // Track current index in local state to handle duplicate names (e.g., 'Jetis' in Bantul and Kota Yogyakarta)
  const [currentKecIndex, setCurrentKecIndex] = useState(0);
  
  // Sync index when selected kecamatan changes from external source
  useEffect(() => {
    // Find the correct index - check if current index already matches
    if (KECAMATAN_LIST[currentKecIndex] !== selectedKecamatan) {
      const newIndex = KECAMATAN_LIST.indexOf(selectedKecamatan);
      if (newIndex !== -1) {
        setCurrentKecIndex(newIndex);
      }
    }
  }, [selectedKecamatan, currentKecIndex]);
  
  const handleKecamatanClick = (kec: string, indexInList?: number) => {
    setSelectedKecamatan(kec);
    markKecamatanVisited(currentStep, kec);
    // If we know the exact index, use it
    if (indexInList !== undefined) {
      setCurrentKecIndex(indexInList);
    }
  };

  const handleNextKecamatan = () => {
    if (currentKecIndex < KECAMATAN_LIST.length - 1) {
      const nextIndex = currentKecIndex + 1;
      const nextKec = KECAMATAN_LIST[nextIndex];
      setCurrentKecIndex(nextIndex);
      setSelectedKecamatan(nextKec);
      markKecamatanVisited(currentStep, nextKec);
      
      // Expand the kabupaten containing this kecamatan (extracted from key)
      const kab = getKabupatenFromKey(nextKec);
      setExpandedKabupaten(prev => ({ ...prev, [kab]: true }));
    }
  };

  const toggleKabupaten = (kab: string) => {
    setExpandedKabupaten(prev => ({ ...prev, [kab]: !prev[kab] }));
  };

  const isAllVisited = KECAMATAN_LIST.every(kec => visitedKecamatan.includes(kec));
  const hasNextKecamatan = currentKecIndex < KECAMATAN_LIST.length - 1;
  
  // Get visited count per kabupaten (using new key format)
  const getKabupatenProgress = (kab: KabupatenKey) => {
    const kecs = KECAMATAN_BY_KABUPATEN[kab] as readonly string[];
    // Count visited by checking with full key format
    const visited = kecs.filter(kec => visitedKecamatan.includes(createKecamatanKey(kab, kec))).length;
    return { visited, total: kecs.length };
  };

  // Filter kecamatan by search query (search by display name)
  const filterKecamatan = (kecs: readonly string[]) => {
    if (!searchQuery) return kecs;
    return kecs.filter(kec => 
      kec.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className="text-2xl font-bold">{title}</h2>}
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
      )}

      {/* Main Layout: Sidebar + Content */}
      <div className="flex gap-6">
        {/* Vertical Kecamatan Sidebar */}
        <div className="w-64 shrink-0">
          <Card className="sticky top-4 max-h-[calc(100vh-120px)] overflow-hidden flex flex-col">
            <CardContent className="p-3 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Pilih Kecamatan
                </span>
              </div>
              
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari kecamatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              
              {/* Kecamatan List grouped by Kabupaten */}
              <div className="overflow-y-auto max-h-[400px] space-y-1 pr-1">
                {(Object.keys(KECAMATAN_BY_KABUPATEN) as KabupatenKey[]).map((kab) => {
                  const kecs = KECAMATAN_BY_KABUPATEN[kab];
                  const filteredKecs = filterKecamatan(kecs);
                  const progress = getKabupatenProgress(kab);
                  const isExpanded = expandedKabupaten[kab] || searchQuery.length > 0;
                  
                  // Hide kabupaten if no kecamatan match search
                  if (searchQuery && filteredKecs.length === 0) return null;
                  
                  return (
                    <div key={kab} className="mb-2">
                      {/* Kabupaten Header */}
                      <button
                        onClick={() => toggleKabupaten(kab)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 rounded-md transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate flex-1 text-left">{kab}</span>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full",
                          progress.visited === progress.total 
                            ? "bg-green-100 text-green-700" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {progress.visited}/{progress.total}
                        </span>
                      </button>
                      
                      {/* Kecamatan List */}
                      {isExpanded && (
                        <div className="ml-2 mt-1 space-y-0.5">
                          {filteredKecs.map((kec, localIdx) => {
                            // Create unique key for this kecamatan
                            const kecKey = createKecamatanKey(kab, kec);
                            const isVisited = visitedKecamatan.includes(kecKey);
                            const isSelected = selectedKecamatan === kecKey;
                            
                            // Calculate global index in KECAMATAN_LIST
                            const globalIdx = KECAMATAN_LIST.indexOf(kecKey);
                            
                            return (
                              <button
                                key={kecKey}
                                onClick={() => handleKecamatanClick(kecKey, globalIdx)}
                                className={cn(
                                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all text-sm",
                                  isSelected 
                                    ? "bg-[#0D73A5] text-white shadow-md" 
                                    : isVisited
                                      ? "bg-green-50 hover:bg-green-100 text-green-800"
                                      : "hover:bg-muted/50 text-foreground"
                                )}
                              >
                                <div className="shrink-0">
                                  {isVisited ? (
                                    <CheckCircle2 className={cn(
                                      "h-4 w-4",
                                      isSelected ? "text-white" : "text-green-600"
                                    )} />
                                  ) : (
                                    <Circle className={cn(
                                      "h-4 w-4",
                                      isSelected ? "text-white/70" : "text-muted-foreground"
                                    )} />
                                  )}
                                </div>
                                <span className="truncate">{kec}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Progress indicator */}
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span>{visitedKecamatan.length}/{KECAMATAN_LIST.length}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      isAllVisited ? "bg-green-500" : "bg-[#0D73A5]"
                    )}
                    style={{ width: `${(visitedKecamatan.length / KECAMATAN_LIST.length) * 100}%` }}
                  />
                </div>
                {isAllVisited && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Semua kecamatan sudah dikunjungi
                  </p>
                )}
              </div>
              
              {/* Next Kecamatan Button */}
              {hasNextKecamatan && (
                <Button
                  onClick={handleNextKecamatan}
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                >
                  Kecamatan Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
};
