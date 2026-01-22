import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KABUPATEN_LIST, KabupatenName } from './wizardStore';
import { KECAMATAN_LIST, KECAMATAN_BY_KABUPATEN, getKabupatenFromKey } from './kecamatanStore';

// Re-export types from wizardStore for convenience
export type { KabupatenName } from './wizardStore';

// Types
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
    musimHujan: 0 | 1;
    bulanPlus1MusimHujan: 0 | 1;
}

export interface PDKMData {
    pdkm: 0 | 1;
    pdcht: 0 | 1;
}

// Kabupaten-level data (manual input per kabupaten)
export interface KabupatenInputData {
    globalAnomaliesDry: GlobalAnomaliesDry;
    globalAnomaliesWet: GlobalAnomaliesWet;
    seasonToggles: SeasonToggles;
    pdkm: PDKMData;
}

// Kecamatan-level data (manual input per kecamatan for steps 0-2)
export interface KecamatanInputData {
    globalAnomaliesDry: GlobalAnomaliesDry;
    globalAnomaliesWet: GlobalAnomaliesWet;
    seasonToggles: SeasonToggles;
    // Note: PDKM is inherited from kabupaten
}

// Shared HTH data structure
export interface HTHData {
    file: File | null;
    parsed: Record<string, string>[] | null;
    columnMapping: {
        lon: string;
        lat: string;
        hth: string;
    } | null;
    // Results for both kabupaten and kecamatan
    resultsKabupaten: {
        [kabupaten: string]: {
            hth_kering: 0 | 1;
            hth_basah: 0 | 1;
        };
    } | null;
    resultsKecamatan: {
        [kecamatan: string]: {
            hth_kering: 0 | 1;
            hth_basah: 0 | 1;
        };
    } | null;
}

// Shared CH/SH data structure
export interface CHSHData {
    uploadMode: 'mode1' | 'mode2';
    mode1File: File | null;
    mode1Parsed: Record<string, string>[] | null;
    mode1ColumnMapping: {
        lon: string;
        lat: string;
        ch: string;
        sh: string;
    } | null;
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
    thresholds: {
        chLow: [number, number];
        chHigh: number;
        shBN: [number, number];
        shAN: [number, number];
    };
    // Results for both levels
    resultsKabupaten: {
        [kabupaten: string]: {
            ch_bulanan_rendah: 0 | 1;
            sh_bulanan_BN: 0 | 1;
            ch_bulanan_tinggi: 0 | 1;
            sh_bulanan_AN: 0 | 1;
        };
    } | null;
    resultsKecamatan: {
        [kecamatan: string]: {
            ch_bulanan_rendah: 0 | 1;
            sh_bulanan_BN: 0 | 1;
            ch_bulanan_tinggi: 0 | 1;
            sh_bulanan_AN: 0 | 1;
        };
    } | null;
    matchingMethod: 'coordinates' | 'nogrid';
    useGridInterpolation: boolean;
}

// Active input level for steps 0-2
export type InputLevel = 'kabupaten' | 'kecamatan';

export interface CombinedWizardState {
    // Current step
    currentStep: number;
    completedSteps: number[];

    // Active input level (for steps 0-2 with dual input)
    activeInputLevel: InputLevel;

    // Selected items for each level
    selectedKabupaten: KabupatenName;
    selectedKecamatan: string;

    // Visit tracking per step (for steps 0-2, track both levels)
    visitedKabupatenPerStep: Record<number, KabupatenName[]>;
    visitedKecamatanPerStep: Record<number, string[]>;

    // Data per kabupaten (step 0-2 manual input + PDKM)
    kabupatenData: Record<KabupatenName, KabupatenInputData>;

    // Data per kecamatan (step 0-2 manual input only)
    kecamatanData: Record<string, KecamatanInputData>;

    // Shared data (HTH, CH/SH) - applies to both levels
    hthData: HTHData;
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
    setActiveInputLevel: (level: InputLevel) => void;
    setSelectedKabupaten: (kab: KabupatenName) => void;
    setSelectedKecamatan: (kec: string) => void;

    // Visit tracking
    markKabupatenVisited: (step: number, kab: KabupatenName) => void;
    markKecamatanVisited: (step: number, kec: string) => void;
    isAllKabupatenVisited: (step: number) => boolean;
    isAllKecamatanVisited: (step: number) => boolean;
    isStepComplete: (step: number) => boolean;

    // Kabupaten data updates
    updateKabupatenGlobalAnomaliesDry: (kab: KabupatenName, data: Partial<GlobalAnomaliesDry>) => void;
    updateKabupatenGlobalAnomaliesWet: (kab: KabupatenName, data: Partial<GlobalAnomaliesWet>) => void;
    updateKabupatenSeasonToggles: (kab: KabupatenName, data: Partial<SeasonToggles>) => void;
    updateKabupatenPDKM: (kab: KabupatenName, data: Partial<PDKMData>) => void;

    // Kecamatan data updates
    updateKecamatanGlobalAnomaliesDry: (kec: string, data: Partial<GlobalAnomaliesDry>) => void;
    updateKecamatanGlobalAnomaliesWet: (kec: string, data: Partial<GlobalAnomaliesWet>) => void;
    updateKecamatanSeasonToggles: (kec: string, data: Partial<SeasonToggles>) => void;

    // Shared data updates
    updateHTHData: (data: Partial<HTHData>) => void;
    updateCHSHData: (period: 'monthly' | 'dasarian' | 'plus1' | 'plus2' | 'plus3', data: Partial<CHSHData>) => void;

    // Utility
    setFinalResults: (results: any) => void;
    resetWizard: () => void;

    // Helper to get PDKM for a kecamatan (from parent kabupaten)
    getKecamatanPDKM: (kec: string) => PDKMData;
}

// Create default data structures
function createDefaultGlobalAnomaliesDry(): GlobalAnomaliesDry {
    return {
        elNino: 0,
        iodPositif: 0,
        elNinoBerlanjut: 0,
        iodPositifBerlanjut: 0,
    };
}

function createDefaultGlobalAnomaliesWet(): GlobalAnomaliesWet {
    return {
        laNina: 0,
        iodNegatif: 0,
        laNinaBerlanjut: 0,
        iodNegatifBerlanjut: 0,
    };
}

function createDefaultSeasonToggles(): SeasonToggles {
    return {
        musimKemarau: 0,
        bulanPlus1MusimKemarau: 0,
        musimHujan: 1,
        bulanPlus1MusimHujan: 1,
    };
}

function createDefaultPDKM(): PDKMData {
    return { pdkm: 0, pdcht: 0 };
}

function createDefaultKabupatenData(): KabupatenInputData {
    return {
        globalAnomaliesDry: createDefaultGlobalAnomaliesDry(),
        globalAnomaliesWet: createDefaultGlobalAnomaliesWet(),
        seasonToggles: createDefaultSeasonToggles(),
        pdkm: createDefaultPDKM(),
    };
}

function createDefaultKecamatanData(): KecamatanInputData {
    return {
        globalAnomaliesDry: createDefaultGlobalAnomaliesDry(),
        globalAnomaliesWet: createDefaultGlobalAnomaliesWet(),
        seasonToggles: createDefaultSeasonToggles(),
    };
}

function createInitialKabupatenData(): Record<KabupatenName, KabupatenInputData> {
    const data = {} as Record<KabupatenName, KabupatenInputData>;
    KABUPATEN_LIST.forEach(kab => {
        data[kab] = createDefaultKabupatenData();
    });
    return data;
}

function createInitialKecamatanData(): Record<string, KecamatanInputData> {
    const data: Record<string, KecamatanInputData> = {};
    KECAMATAN_LIST.forEach(kec => {
        data[kec] = createDefaultKecamatanData();
    });
    return data;
}

function createDefaultHTHData(): HTHData {
    return {
        file: null,
        parsed: null,
        columnMapping: null,
        resultsKabupaten: null,
        resultsKecamatan: null,
    };
}

function createDefaultCHSHData(): CHSHData {
    return {
        uploadMode: 'mode2',
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
            chLow: [0, 100],
            chHigh: 301,
            shBN: [0, 84],
            shAN: [116, 9999],
        },
        resultsKabupaten: null,
        resultsKecamatan: null,
        matchingMethod: 'coordinates',
        useGridInterpolation: true,
    };
}

// Dasarian has different CH thresholds:
// CH Rendah: < 50 mm/dasarian
// CH Tinggi: > 150 mm/dasarian
function createDefaultCHSHDataDasarian(): CHSHData {
    return {
        uploadMode: 'mode2',
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
            chLow: [0, 49],       // CH Dasarian Rendah: < 50 mm
            chHigh: 151,          // CH Dasarian Tinggi: > 150 mm
            shBN: [0, 84],        // SH same as monthly
            shAN: [116, 9999],    // SH same as monthly
        },
        resultsKabupaten: null,
        resultsKecamatan: null,
        matchingMethod: 'coordinates',
        useGridInterpolation: true,
    };
}

const initialState = {
    currentStep: 0,
    completedSteps: [] as number[],
    activeInputLevel: 'kabupaten' as InputLevel,
    selectedKabupaten: 'Sleman' as KabupatenName,
    selectedKecamatan: KECAMATAN_LIST[0],
    visitedKabupatenPerStep: {} as Record<number, KabupatenName[]>,
    visitedKecamatanPerStep: {} as Record<number, string[]>,
    kabupatenData: createInitialKabupatenData(),
    kecamatanData: createInitialKecamatanData(),
    hthData: createDefaultHTHData(),
    chshMonthly: createDefaultCHSHData(),
    chshDasarian: createDefaultCHSHDataDasarian(), // Use dasarian-specific thresholds
    chshPredictionPlus1: createDefaultCHSHData(),
    chshPredictionPlus2: createDefaultCHSHData(),
    chshPredictionPlus3: createDefaultCHSHData(),
    finalResults: null,
};

export const useCombinedStore = create<CombinedWizardState>()(
    persist(
        (set, get) => ({
            ...initialState,

            setCurrentStep: (step) => set({ currentStep: step }),

            setCompletedStep: (step) =>
                set((state) => ({
                    completedSteps: [...new Set([...state.completedSteps, step])],
                })),

            setActiveInputLevel: (level) => set({ activeInputLevel: level }),

            setSelectedKabupaten: (kab) => set({ selectedKabupaten: kab }),

            setSelectedKecamatan: (kec) => set({ selectedKecamatan: kec }),

            // Visit tracking - Kabupaten
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

            // Visit tracking - Kecamatan
            markKecamatanVisited: (step, kec) =>
                set((state) => {
                    const currentVisited = state.visitedKecamatanPerStep[step] || [];
                    if (!currentVisited.includes(kec)) {
                        return {
                            visitedKecamatanPerStep: {
                                ...state.visitedKecamatanPerStep,
                                [step]: [...currentVisited, kec],
                            },
                        };
                    }
                    return {};
                }),

            isAllKabupatenVisited: (step) => {
                const state = get();
                const visited = state.visitedKabupatenPerStep[step] || [];
                return KABUPATEN_LIST.every(kab => visited.includes(kab));
            },

            isAllKecamatanVisited: (step) => {
                const state = get();
                const visited = state.visitedKecamatanPerStep[step] || [];
                return KECAMATAN_LIST.every(kec => visited.includes(kec));
            },

            // For steps 0-2, only kabupaten input is needed (kecamatan auto-filled)
            isStepComplete: (step) => {
                // Steps 0-2 use kabupaten-only input, kecamatan is auto-filled
                // No visit tracking needed for these steps
                return true; // Always complete since all kabupaten cards are visible
            },

            // Kabupaten data updates
            updateKabupatenGlobalAnomaliesDry: (kab, data) =>
                set((state) => ({
                    kabupatenData: {
                        ...state.kabupatenData,
                        [kab]: {
                            ...state.kabupatenData[kab],
                            globalAnomaliesDry: {
                                ...state.kabupatenData[kab].globalAnomaliesDry,
                                ...data,
                            },
                        },
                    },
                })),

            updateKabupatenGlobalAnomaliesWet: (kab, data) =>
                set((state) => ({
                    kabupatenData: {
                        ...state.kabupatenData,
                        [kab]: {
                            ...state.kabupatenData[kab],
                            globalAnomaliesWet: {
                                ...state.kabupatenData[kab].globalAnomaliesWet,
                                ...data,
                            },
                        },
                    },
                })),

            updateKabupatenSeasonToggles: (kab, data) =>
                set((state) => {
                    const currentToggles = state.kabupatenData[kab].seasonToggles;
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
                            [kab]: {
                                ...state.kabupatenData[kab],
                                seasonToggles: newToggles,
                            },
                        },
                    };
                }),

            updateKabupatenPDKM: (kab, data) =>
                set((state) => ({
                    kabupatenData: {
                        ...state.kabupatenData,
                        [kab]: {
                            ...state.kabupatenData[kab],
                            pdkm: {
                                ...state.kabupatenData[kab].pdkm,
                                ...data,
                            },
                        },
                    },
                })),

            // Kecamatan data updates
            updateKecamatanGlobalAnomaliesDry: (kec, data) =>
                set((state) => ({
                    kecamatanData: {
                        ...state.kecamatanData,
                        [kec]: {
                            ...state.kecamatanData[kec],
                            globalAnomaliesDry: {
                                ...state.kecamatanData[kec]?.globalAnomaliesDry,
                                ...data,
                            },
                        },
                    },
                })),

            updateKecamatanGlobalAnomaliesWet: (kec, data) =>
                set((state) => ({
                    kecamatanData: {
                        ...state.kecamatanData,
                        [kec]: {
                            ...state.kecamatanData[kec],
                            globalAnomaliesWet: {
                                ...state.kecamatanData[kec]?.globalAnomaliesWet,
                                ...data,
                            },
                        },
                    },
                })),

            updateKecamatanSeasonToggles: (kec, data) =>
                set((state) => {
                    const currentToggles = state.kecamatanData[kec]?.seasonToggles || createDefaultSeasonToggles();
                    const newToggles = { ...currentToggles, ...data };

                    // Auto-derive inverse values
                    if ('musimKemarau' in data) {
                        newToggles.musimHujan = (data.musimKemarau === 1 ? 0 : 1) as 0 | 1;
                    }
                    if ('bulanPlus1MusimKemarau' in data) {
                        newToggles.bulanPlus1MusimHujan = (data.bulanPlus1MusimKemarau === 1 ? 0 : 1) as 0 | 1;
                    }

                    return {
                        kecamatanData: {
                            ...state.kecamatanData,
                            [kec]: {
                                ...state.kecamatanData[kec],
                                seasonToggles: newToggles,
                            },
                        },
                    };
                }),

            // Shared data updates
            updateHTHData: (data) =>
                set((state) => ({
                    hthData: { ...state.hthData, ...data },
                })),

            updateCHSHData: (period, data) =>
                set((state) => {
                    const periodKey = {
                        monthly: 'chshMonthly',
                        dasarian: 'chshDasarian',
                        plus1: 'chshPredictionPlus1',
                        plus2: 'chshPredictionPlus2',
                        plus3: 'chshPredictionPlus3',
                    }[period] as keyof Pick<
                        CombinedWizardState,
                        'chshMonthly' | 'chshDasarian' | 'chshPredictionPlus1' | 'chshPredictionPlus2' | 'chshPredictionPlus3'
                    >;

                    return {
                        [periodKey]: { ...state[periodKey], ...data },
                    };
                }),

            setFinalResults: (results) => set({ finalResults: results }),

            resetWizard: () => set(initialState),

            // Helper to get PDKM for a kecamatan from its parent kabupaten
            getKecamatanPDKM: (kec) => {
                const state = get();
                const kabupaten = getKabupatenFromKey(kec) as KabupatenName;
                return state.kabupatenData[kabupaten]?.pdkm || createDefaultPDKM();
            },
        }),
        {
            name: 'skpg-combined-storage',
            partialize: (state) => ({
                currentStep: state.currentStep,
                completedSteps: state.completedSteps,
                activeInputLevel: state.activeInputLevel,
                selectedKabupaten: state.selectedKabupaten,
                selectedKecamatan: state.selectedKecamatan,
                visitedKabupatenPerStep: state.visitedKabupatenPerStep,
                visitedKecamatanPerStep: state.visitedKecamatanPerStep,
                kabupatenData: state.kabupatenData,
                kecamatanData: state.kecamatanData,
                // HTH - partial
                hthData: {
                    columnMapping: state.hthData.columnMapping,
                    resultsKabupaten: state.hthData.resultsKabupaten,
                    resultsKecamatan: state.hthData.resultsKecamatan,
                },
                // CHSH periods - partial
                chshMonthly: {
                    uploadMode: state.chshMonthly.uploadMode,
                    resultsKabupaten: state.chshMonthly.resultsKabupaten,
                    resultsKecamatan: state.chshMonthly.resultsKecamatan,
                    matchingMethod: state.chshMonthly.matchingMethod,
                    useGridInterpolation: state.chshMonthly.useGridInterpolation,
                },
                chshDasarian: {
                    uploadMode: state.chshDasarian.uploadMode,
                    resultsKabupaten: state.chshDasarian.resultsKabupaten,
                    resultsKecamatan: state.chshDasarian.resultsKecamatan,
                    matchingMethod: state.chshDasarian.matchingMethod,
                    useGridInterpolation: state.chshDasarian.useGridInterpolation,
                },
                chshPredictionPlus1: {
                    uploadMode: state.chshPredictionPlus1.uploadMode,
                    resultsKabupaten: state.chshPredictionPlus1.resultsKabupaten,
                    resultsKecamatan: state.chshPredictionPlus1.resultsKecamatan,
                    matchingMethod: state.chshPredictionPlus1.matchingMethod,
                    useGridInterpolation: state.chshPredictionPlus1.useGridInterpolation,
                },
                chshPredictionPlus2: {
                    uploadMode: state.chshPredictionPlus2.uploadMode,
                    resultsKabupaten: state.chshPredictionPlus2.resultsKabupaten,
                    resultsKecamatan: state.chshPredictionPlus2.resultsKecamatan,
                    matchingMethod: state.chshPredictionPlus2.matchingMethod,
                    useGridInterpolation: state.chshPredictionPlus2.useGridInterpolation,
                },
                chshPredictionPlus3: {
                    uploadMode: state.chshPredictionPlus3.uploadMode,
                    resultsKabupaten: state.chshPredictionPlus3.resultsKabupaten,
                    resultsKecamatan: state.chshPredictionPlus3.resultsKecamatan,
                    matchingMethod: state.chshPredictionPlus3.matchingMethod,
                    useGridInterpolation: state.chshPredictionPlus3.useGridInterpolation,
                },
                finalResults: state.finalResults,
            }),
            merge: (persistedState, currentState) => {
                const persisted = persistedState as Partial<CombinedWizardState>;

                // Default thresholds for monthly/prediction (bulanan)
                const defaultThresholdsBulanan = {
                    chLow: [0, 100] as [number, number],
                    chHigh: 301,
                    shBN: [0, 84] as [number, number],
                    shAN: [116, 9999] as [number, number],
                };

                // Default thresholds for dasarian (10-daily)
                const defaultThresholdsDasarian = {
                    chLow: [0, 49] as [number, number],  // CH < 50 mm
                    chHigh: 151,                         // CH > 150 mm
                    shBN: [0, 84] as [number, number],
                    shAN: [116, 9999] as [number, number],
                };

                // Merge with appropriate thresholds for each CHSH period
                const mergeChsh = (stored: Partial<CHSHData> | undefined, current: CHSHData, defaultThresholds: typeof defaultThresholdsBulanan): CHSHData => ({
                    ...current,
                    ...stored,
                    thresholds: stored?.thresholds || defaultThresholds,
                });

                return {
                    ...currentState,
                    ...persisted,
                    chshMonthly: mergeChsh(persisted.chshMonthly, currentState.chshMonthly, defaultThresholdsBulanan),
                    chshDasarian: mergeChsh(persisted.chshDasarian, currentState.chshDasarian, defaultThresholdsDasarian),
                    chshPredictionPlus1: mergeChsh(persisted.chshPredictionPlus1, currentState.chshPredictionPlus1, defaultThresholdsBulanan),
                    chshPredictionPlus2: mergeChsh(persisted.chshPredictionPlus2, currentState.chshPredictionPlus2, defaultThresholdsBulanan),
                    chshPredictionPlus3: mergeChsh(persisted.chshPredictionPlus3, currentState.chshPredictionPlus3, defaultThresholdsBulanan),
                };
            },
        }
    )
);
