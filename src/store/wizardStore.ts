import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Kabupaten list from geojson
export const KABUPATEN_LIST = [
  'Sleman',
  'Bantul',
  'Kota Yogyakarta',
  'Kulon Progo',
  'Gunungkidul',
] as const;

export type KabupatenName = typeof KABUPATEN_LIST[number];

// Types for wizard state - PER KABUPATEN
export interface GlobalAnomaliesDry {
  elNino: 0 | 1;
  iodPositif: 0 | 1;
  elNinoBerlanjut: 0 | 1;
  iodPositifBerlanjut: 0 | 1;
}

export interface GlobalAnomaliesWet {
  laNina: 0 | 1;
  iodNegatif: 0 | 1;
  laNinaBerlanjut: 0 | 1;
  iodNegatifBerlanjut: 0 | 1;
}

export interface SeasonToggles {
  musimKemarau: 0 | 1;
  bulanPlus1MusimKemarau: 0 | 1;
  // Auto-derived (inverse)
  musimHujan: 0 | 1;
  bulanPlus1MusimHujan: 0 | 1;
}

// Data structure per kabupaten
export interface KabupatenData {
  globalAnomaliesDry: GlobalAnomaliesDry;
  globalAnomaliesWet: GlobalAnomaliesWet;
  seasonToggles: SeasonToggles;
  pdkm: PDKMData;
}

export interface HTHData {
  file: File | null;
  parsed: Record<string, string>[] | null;
  columnMapping: {
    lon: string;
    lat: string;
    hth: string;
  } | null;
  results: {
    [kabupaten: string]: {
      hth_kering: 0 | 1;
      hth_basah: 0 | 1;
    };
  } | null;
}

export interface CHSHData {
  // Mode upload: 'mode1' = 1 file (CH+SH), 'mode2' = 2 file terpisah
  uploadMode: 'mode1' | 'mode2';

  // Mode 1: 1 file dengan CH dan SH
  mode1File: File | null;
  mode1Parsed: Record<string, string>[] | null;
  mode1ColumnMapping: {
    lon: string;
    lat: string;
    ch: string;
    sh: string;
  } | null;

  // Mode 2: 2 file terpisah (existing)
  chFile: File | null;
  shFile: File | null;
  chParsed: Record<string, string>[] | null;
  shParsed: Record<string, string>[] | null;
  chColumnMapping: {
    lon: string;
    lat: string;
    value: string;
  } | null;
  shColumnMapping: {
    lon: string;
    lat: string;
    value: string;
  } | null;

  // Threshold fixed sesuai klasifikasi BMKG (tidak bisa diubah)
  thresholds: {
    chLow: [0, 100]; // CH rendah: 0-100mm
    chHigh: 301; // CH tinggi: >= 301mm
    shBN: [0, 84]; // SH Bawah Normal: 0-84%
    shAN: [116, 9999]; // SH Atas Normal: >= 116% (tidak ada batas atas)
  };
  results: {
    [kabupaten: string]: {
      ch_bulanan_rendah: 0 | 1;
      sh_bulanan_BN: 0 | 1;
      ch_bulanan_tinggi: 0 | 1;
      sh_bulanan_AN: 0 | 1;
    };
  } | null;
  matchingMethod: 'coordinates' | 'nogrid';
  useGridInterpolation: boolean;
}

export interface PDKMData {
  pdkm: 0 | 1;
  pdcht: 0 | 1;
}

export interface WizardState {
  // Current step
  currentStep: number;
  completedSteps: number[];

  // Current selected kabupaten
  selectedKabupaten: KabupatenName;

  // Track visited kabupaten per step (for validation)
  visitedKabupatenPerStep: Record<number, KabupatenName[]>;

  // Data PER KABUPATEN
  kabupatenData: Record<KabupatenName, KabupatenData>;

  // HTH Data (file upload, shared across kabupaten)
  hthData: HTHData;

  // CH/SH data for different periods (file upload, shared across kabupaten)
  chshMonthly: CHSHData;
  chshDasarian: CHSHData;
  chshPredictionPlus1: CHSHData;
  chshPredictionPlus2: CHSHData;
  chshPredictionPlus3: CHSHData;

  // Final results
  finalResults: any | null;

  // Actions
  setCurrentStep: (step: number) => void;
  setCompletedStep: (step: number) => void;
  setSelectedKabupaten: (kab: KabupatenName) => void;
  markKabupatenVisited: (step: number, kab: KabupatenName) => void;
  resetKabupatenVisitedForStep: (step: number) => void;
  isAllKabupatenVisited: (step: number) => boolean;
  updateGlobalAnomaliesDry: (kabupaten: KabupatenName, data: Partial<GlobalAnomaliesDry>) => void;
  updateGlobalAnomaliesWet: (kabupaten: KabupatenName, data: Partial<GlobalAnomaliesWet>) => void;
  updateSeasonToggles: (kabupaten: KabupatenName, data: Partial<SeasonToggles>) => void;
  updatePDKM: (kabupaten: KabupatenName, data: Partial<PDKMData>) => void;
  updateHTHData: (data: Partial<HTHData>) => void;
  updateCHSHData: (period: 'monthly' | 'dasarian' | 'plus1' | 'plus2' | 'plus3', data: Partial<CHSHData>) => void;
  setFinalResults: (results: any) => void;
  resetWizard: () => void;
}

// Create default data for one kabupaten
function createDefaultKabupatenData(): KabupatenData {
  return {
    globalAnomaliesDry: {
      elNino: 0 as 0 | 1,
      iodPositif: 0 as 0 | 1,
      elNinoBerlanjut: 0 as 0 | 1,
      iodPositifBerlanjut: 0 as 0 | 1,
    },
    globalAnomaliesWet: {
      laNina: 0 as 0 | 1,
      iodNegatif: 0 as 0 | 1,
      laNinaBerlanjut: 0 as 0 | 1,
      iodNegatifBerlanjut: 0 as 0 | 1,
    },
    seasonToggles: {
      musimKemarau: 0 as 0 | 1,
      bulanPlus1MusimKemarau: 0 as 0 | 1,
      musimHujan: 1 as 0 | 1,
      bulanPlus1MusimHujan: 1 as 0 | 1,
    },
    pdkm: {
      pdkm: 0 as 0 | 1,
      pdcht: 0 as 0 | 1,
    },
  };
}

// Initialize data for all kabupaten
function createInitialKabupatenData(): Record<KabupatenName, KabupatenData> {
  const data = {} as Record<KabupatenName, KabupatenData>;
  KABUPATEN_LIST.forEach(kab => {
    data[kab] = createDefaultKabupatenData();
  });
  return data;
}

const initialState = {
  currentStep: 0,
  completedSteps: [],
  selectedKabupaten: 'Sleman' as KabupatenName,
  visitedKabupatenPerStep: {} as Record<number, KabupatenName[]>,

  // Data per kabupaten
  kabupatenData: createInitialKabupatenData(),

  hthData: {
    file: null,
    parsed: null,
    columnMapping: null,
    results: null,
  },

  chshMonthly: createDefaultCHSHData(),
  chshDasarian: createDefaultCHSHData(),
  chshPredictionPlus1: createDefaultCHSHData(),
  chshPredictionPlus2: createDefaultCHSHData(),
  chshPredictionPlus3: createDefaultCHSHData(),

  finalResults: null,
};

function createDefaultCHSHData(): CHSHData {
  return {
    uploadMode: 'mode2', // Default ke mode 2 (2 file terpisah)
    mode1File: null,
    mode1Parsed: null,
    mode1ColumnMapping: null,
    chFile: null,
    shFile: null,
    chParsed: null,
    shParsed: null,
    chColumnMapping: null,
    shColumnMapping: null,
    thresholds: {
      chLow: [0, 100] as [number, number], // Fixed: CH rendah 0-100mm
      chHigh: 301, // Fixed: CH tinggi >= 301mm
      shBN: [0, 84] as [number, number], // Fixed: SH Bawah Normal 0-84%
      shAN: [116, 9999] as [number, number], // Fixed: SH Atas Normal >= 116% (semua di atas 115%)
    },
    results: null,
    matchingMethod: 'coordinates',
    useGridInterpolation: false,
  };
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      ...initialState,


      setCurrentStep: (step) => set({ currentStep: step }),

      setCompletedStep: (step) =>
        set((state) => ({
          completedSteps: [...new Set([...state.completedSteps, step])],
        })),

      setSelectedKabupaten: (kab) => set({ selectedKabupaten: kab }),

      markKabupatenVisited: (step, kab) =>
        set((state) => {
          const currentVisited = state.visitedKabupatenPerStep[step] || [];
          if (!currentVisited.includes(kab)) {
            return {
              visitedKabupatenPerStep: {
                ...state.visitedKabupatenPerStep,
                [step]: [...currentVisited, kab],
              },
            };
          }
          return {};
        }),

      resetKabupatenVisitedForStep: (step) =>
        set((state) => ({
          visitedKabupatenPerStep: {
            ...state.visitedKabupatenPerStep,
            [step]: [],
          },
        })),

      isAllKabupatenVisited: (step) => {
        const state = useWizardStore.getState();
        const visited = state.visitedKabupatenPerStep[step] || [];
        return KABUPATEN_LIST.every(kab => visited.includes(kab));
      },


      updateGlobalAnomaliesDry: (kabupaten, data) =>
        set((state) => ({
          kabupatenData: {
            ...state.kabupatenData,
            [kabupaten]: {
              ...state.kabupatenData[kabupaten],
              globalAnomaliesDry: {
                ...state.kabupatenData[kabupaten].globalAnomaliesDry,
                ...data,
              },
            },
          },
        })),

      updateGlobalAnomaliesWet: (kabupaten, data) =>
        set((state) => ({
          kabupatenData: {
            ...state.kabupatenData,
            [kabupaten]: {
              ...state.kabupatenData[kabupaten],
              globalAnomaliesWet: {
                ...state.kabupatenData[kabupaten].globalAnomaliesWet,
                ...data,
              },
            },
          },
        })),

      updateSeasonToggles: (kabupaten, data) =>
        set((state) => {
          const currentToggles = state.kabupatenData[kabupaten].seasonToggles;
          const newToggles = { ...currentToggles, ...data };

          // Auto-derive inverse values
          if ('musimKemarau' in data) {
            newToggles.musimHujan = data.musimKemarau === 1 ? 0 : 1;
          }
          if ('bulanPlus1MusimKemarau' in data) {
            newToggles.bulanPlus1MusimHujan = data.bulanPlus1MusimKemarau === 1 ? 0 : 1;
          }

          return {
            kabupatenData: {
              ...state.kabupatenData,
              [kabupaten]: {
                ...state.kabupatenData[kabupaten],
                seasonToggles: newToggles,
              },
            },
          };
        }),

      updatePDKM: (kabupaten, data) =>
        set((state) => ({
          kabupatenData: {
            ...state.kabupatenData,
            [kabupaten]: {
              ...state.kabupatenData[kabupaten],
              pdkm: {
                ...state.kabupatenData[kabupaten].pdkm,
                ...data,
              },
            },
          },
        })),

      updateHTHData: (data) =>
        set((state) => ({
          hthData: { ...state.hthData, ...data },
        })),

      updateCHSHData: (period, data) =>
        set((state) => {
          const periodKey =
            period === 'monthly' ? 'chshMonthly' :
              period === 'dasarian' ? 'chshDasarian' :
                period === 'plus1' ? 'chshPredictionPlus1' :
                  period === 'plus2' ? 'chshPredictionPlus2' :
                    'chshPredictionPlus3';

          return {
            [periodKey]: { ...state[periodKey], ...data },
          };
        }),

      setFinalResults: (results) => set({ finalResults: results }),

      resetWizard: () => set(initialState),
    }),
    {
      name: 'skpg-wizard-storage',
      partialize: (state) => ({
        // Only persist data, not UI state
        kabupatenData: state.kabupatenData,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        selectedKabupaten: state.selectedKabupaten,
      }),
    }
  )
);

