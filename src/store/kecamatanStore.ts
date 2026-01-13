import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Kecamatan list grouped by Kabupaten
export const KECAMATAN_BY_KABUPATEN = {
    'Bantul': [
        'Bambanglipuro', 'Banguntapan', 'Bantul', 'Dlingo', 'Imogiri',
        'Jetis', 'Kasihan', 'Kretek', 'Pajangan', 'Pandak',
        'Piyungan', 'Pleret', 'Pundong', 'Sanden', 'Sedayu', 'Sewon', 'Srandakan'
    ],
    'Sleman': [
        'Berbah', 'Cangkringan', 'Depok', 'Gamping', 'Godean',
        'Kalasan', 'Minggir', 'Mlati', 'Moyudan', 'Ngaglik',
        'Ngemplak', 'Pakem', 'Prambanan', 'Seyegan', 'Sleman', 'Tempel', 'Turi'
    ],
    'Gunungkidul': [
        'Gedangsari', 'Girisubo', 'Karangmojo', 'Ngawen', 'Nglipar',
        'Paliyan', 'Panggang', 'Patuk', 'Playen', 'Ponjong',
        'Purwosari', 'Rongkop', 'Saptosari', 'Semanu', 'Semin', 'Tanjungsari', 'Tepus', 'Wonosari'
    ],
    'Kulon Progo': [
        'Galur', 'Girimulyo', 'Kalibawang', 'Kokap', 'Lendah',
        'Nanggulan', 'Panjatan', 'Pengasih', 'Samigaluh', 'Sentolo', 'Temon', 'Wates'
    ],
    'Kota Yogyakarta': [
        'Danurejan', 'Gedongtengen', 'Gondokusuman', 'Gondomanan', 'Jetis',
        'Kotagede', 'Kraton', 'Mantrijeron', 'Mergangsan', 'Ngampilan',
        'Pakualaman', 'Tegalrejo', 'Umbulharjo', 'Wirobrajan'
    ],
} as const;

export type KabupatenKey = keyof typeof KECAMATAN_BY_KABUPATEN;

// Flatten all kecamatan with unique keys: "Kabupaten_Kecamatan"
// This ensures no duplicates (e.g., Jetis in Bantul and Jetis in Kota Yogyakarta)
export const KECAMATAN_LIST: string[] = [];
export const KABUPATEN_BY_KECAMATAN_KEY: Record<string, string> = {};

// Build the list with unique keys
Object.entries(KECAMATAN_BY_KABUPATEN).forEach(([kabupaten, kecamatanList]) => {
    kecamatanList.forEach(kecamatan => {
        const key = `${kabupaten}_${kecamatan}`;
        KECAMATAN_LIST.push(key);
        KABUPATEN_BY_KECAMATAN_KEY[key] = kabupaten;
    });
});

// Helper function to get kabupaten from key
export const getKabupatenFromKey = (key: string): string => {
    return KABUPATEN_BY_KECAMATAN_KEY[key] || key.split('_')[0] || 'Unknown';
};

// Helper function to get kecamatan name from key (display name)
export const getKecamatanFromKey = (key: string): string => {
    const parts = key.split('_');
    return parts.length > 1 ? parts.slice(1).join('_') : key;
};

// Helper function to create key from kabupaten and kecamatan
export const createKecamatanKey = (kabupaten: string, kecamatan: string): string => {
    return `${kabupaten}_${kecamatan}`;
};

export type KecamatanName = string;

// Types for wizard state - same as kabupaten
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

export interface KecamatanData {
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
        [kecamatan: string]: {
            hth_kering: 0 | 1;
            hth_basah: 0 | 1;
        };
    } | null;
}

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
        chLow: [0, 100];
        chHigh: 301;
        shBN: [0, 84];
        shAN: [116, 9999];
    };
    results: {
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

export interface PDKMData {
    pdkm: 0 | 1;
    pdcht: 0 | 1;
}

export interface KecamatanWizardState {
    currentStep: number;
    completedSteps: number[];
    selectedKecamatan: KecamatanName;
    visitedKecamatanPerStep: Record<number, KecamatanName[]>;
    kecamatanData: Record<KecamatanName, KecamatanData>;
    hthData: HTHData;
    chshMonthly: CHSHData;
    chshDasarian: CHSHData;
    chshPredictionPlus1: CHSHData;
    chshPredictionPlus2: CHSHData;
    chshPredictionPlus3: CHSHData;
    finalResults: any | null;

    // Actions
    setCurrentStep: (step: number) => void;
    setCompletedStep: (step: number) => void;
    setSelectedKecamatan: (kec: KecamatanName) => void;
    markKecamatanVisited: (step: number, kec: KecamatanName) => void;
    resetKecamatanVisitedForStep: (step: number) => void;
    isAllKecamatanVisited: (step: number) => boolean;
    updateGlobalAnomaliesDry: (kecamatan: KecamatanName, data: Partial<GlobalAnomaliesDry>) => void;
    updateGlobalAnomaliesWet: (kecamatan: KecamatanName, data: Partial<GlobalAnomaliesWet>) => void;
    updateSeasonToggles: (kecamatan: KecamatanName, data: Partial<SeasonToggles>) => void;
    updatePDKM: (kecamatan: KecamatanName, data: Partial<PDKMData>) => void;
    updateHTHData: (data: Partial<HTHData>) => void;
    updateCHSHData: (period: 'monthly' | 'dasarian' | 'plus1' | 'plus2' | 'plus3', data: Partial<CHSHData>) => void;
    setFinalResults: (results: any) => void;
    resetWizard: () => void;
}

function createDefaultKecamatanData(): KecamatanData {
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
        results: null,
        matchingMethod: 'coordinates',
        useGridInterpolation: true,
    };
}

// Create initial data for all 78 kecamatan
const createInitialKecamatanData = (): Record<KecamatanName, KecamatanData> => {
    const data: Record<string, KecamatanData> = {};
    KECAMATAN_LIST.forEach(kec => {
        data[kec] = createDefaultKecamatanData();
    });
    return data;
};

const initialState = {
    currentStep: 0,
    completedSteps: [] as number[],
    selectedKecamatan: KECAMATAN_LIST[0], // First kecamatan (Bambanglipuro)
    visitedKecamatanPerStep: {} as Record<number, KecamatanName[]>,
    kecamatanData: createInitialKecamatanData(),
    hthData: {
        file: null,
        parsed: null,
        columnMapping: null,
        results: null,
    } as HTHData,
    chshMonthly: createDefaultCHSHData(),
    chshDasarian: createDefaultCHSHData(),
    chshPredictionPlus1: createDefaultCHSHData(),
    chshPredictionPlus2: createDefaultCHSHData(),
    chshPredictionPlus3: createDefaultCHSHData(),
    finalResults: null,
};

export const useKecamatanStore = create<KecamatanWizardState>()(
    persist(
        (set, get) => ({
            ...initialState,

            setCurrentStep: (step) => set({ currentStep: step }),

            setCompletedStep: (step) =>
                set((state) => ({
                    completedSteps: [...new Set([...state.completedSteps, step])],
                })),

            setSelectedKecamatan: (kec) => set({ selectedKecamatan: kec }),

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

            resetKecamatanVisitedForStep: (step) =>
                set((state) => ({
                    visitedKecamatanPerStep: {
                        ...state.visitedKecamatanPerStep,
                        [step]: [],
                    },
                })),

            isAllKecamatanVisited: (step) => {
                const state = useKecamatanStore.getState();
                const visited = state.visitedKecamatanPerStep[step] || [];
                return KECAMATAN_LIST.every(kec => visited.includes(kec));
            },

            updateGlobalAnomaliesDry: (kecamatan, data) =>
                set((state) => ({
                    kecamatanData: {
                        ...state.kecamatanData,
                        [kecamatan]: {
                            ...state.kecamatanData[kecamatan],
                            globalAnomaliesDry: {
                                ...state.kecamatanData[kecamatan]?.globalAnomaliesDry,
                                ...data,
                            },
                        },
                    },
                })),

            updateGlobalAnomaliesWet: (kecamatan, data) =>
                set((state) => ({
                    kecamatanData: {
                        ...state.kecamatanData,
                        [kecamatan]: {
                            ...state.kecamatanData[kecamatan],
                            globalAnomaliesWet: {
                                ...state.kecamatanData[kecamatan]?.globalAnomaliesWet,
                                ...data,
                            },
                        },
                    },
                })),

            updateSeasonToggles: (kecamatan, data) =>
                set((state) => {
                    const currentToggles = state.kecamatanData[kecamatan]?.seasonToggles || {};
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
                            [kecamatan]: {
                                ...state.kecamatanData[kecamatan],
                                seasonToggles: newToggles,
                            },
                        },
                    };
                }),

            updatePDKM: (kecamatan, data) =>
                set((state) => ({
                    kecamatanData: {
                        ...state.kecamatanData,
                        [kecamatan]: {
                            ...state.kecamatanData[kecamatan],
                            pdkm: {
                                ...state.kecamatanData[kecamatan]?.pdkm,
                                ...data,
                            },
                        },
                    },
                })),

            updateHTHData: (data) =>
                set((state) => ({
                    hthData: {
                        ...state.hthData,
                        ...data,
                    },
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
                        KecamatanWizardState,
                        'chshMonthly' | 'chshDasarian' | 'chshPredictionPlus1' | 'chshPredictionPlus2' | 'chshPredictionPlus3'
                    >;

                    return {
                        [periodKey]: {
                            ...state[periodKey],
                            ...data,
                        },
                    };
                }),

            setFinalResults: (results) => set({ finalResults: results }),

            resetWizard: () => set(initialState),
        }),
        {
            name: 'skpg-kecamatan-storage',
            partialize: (state) => ({
                currentStep: state.currentStep,
                completedSteps: state.completedSteps,
                selectedKecamatan: state.selectedKecamatan,
                visitedKecamatanPerStep: state.visitedKecamatanPerStep,
                kecamatanData: state.kecamatanData,
                hthData: {
                    columnMapping: state.hthData.columnMapping,
                    results: state.hthData.results,
                },
                chshMonthly: {
                    uploadMode: state.chshMonthly.uploadMode,
                    mode1ColumnMapping: state.chshMonthly.mode1ColumnMapping,
                    chColumnMapping: state.chshMonthly.chColumnMapping,
                    shColumnMapping: state.chshMonthly.shColumnMapping,
                    thresholds: state.chshMonthly.thresholds,
                    results: state.chshMonthly.results,
                    matchingMethod: state.chshMonthly.matchingMethod,
                    useGridInterpolation: state.chshMonthly.useGridInterpolation,
                },
                chshDasarian: {
                    uploadMode: state.chshDasarian.uploadMode,
                    mode1ColumnMapping: state.chshDasarian.mode1ColumnMapping,
                    chColumnMapping: state.chshDasarian.chColumnMapping,
                    shColumnMapping: state.chshDasarian.shColumnMapping,
                    thresholds: state.chshDasarian.thresholds,
                    results: state.chshDasarian.results,
                    matchingMethod: state.chshDasarian.matchingMethod,
                    useGridInterpolation: state.chshDasarian.useGridInterpolation,
                },
                chshPredictionPlus1: {
                    uploadMode: state.chshPredictionPlus1.uploadMode,
                    mode1ColumnMapping: state.chshPredictionPlus1.mode1ColumnMapping,
                    chColumnMapping: state.chshPredictionPlus1.chColumnMapping,
                    shColumnMapping: state.chshPredictionPlus1.shColumnMapping,
                    thresholds: state.chshPredictionPlus1.thresholds,
                    results: state.chshPredictionPlus1.results,
                    matchingMethod: state.chshPredictionPlus1.matchingMethod,
                    useGridInterpolation: state.chshPredictionPlus1.useGridInterpolation,
                },
                chshPredictionPlus2: {
                    uploadMode: state.chshPredictionPlus2.uploadMode,
                    mode1ColumnMapping: state.chshPredictionPlus2.mode1ColumnMapping,
                    chColumnMapping: state.chshPredictionPlus2.chColumnMapping,
                    shColumnMapping: state.chshPredictionPlus2.shColumnMapping,
                    thresholds: state.chshPredictionPlus2.thresholds,
                    results: state.chshPredictionPlus2.results,
                    matchingMethod: state.chshPredictionPlus2.matchingMethod,
                    useGridInterpolation: state.chshPredictionPlus2.useGridInterpolation,
                },
                chshPredictionPlus3: {
                    uploadMode: state.chshPredictionPlus3.uploadMode,
                    mode1ColumnMapping: state.chshPredictionPlus3.mode1ColumnMapping,
                    chColumnMapping: state.chshPredictionPlus3.chColumnMapping,
                    shColumnMapping: state.chshPredictionPlus3.shColumnMapping,
                    thresholds: state.chshPredictionPlus3.thresholds,
                    results: state.chshPredictionPlus3.results,
                    matchingMethod: state.chshPredictionPlus3.matchingMethod,
                    useGridInterpolation: state.chshPredictionPlus3.useGridInterpolation,
                },
                finalResults: state.finalResults,
            }),
        }
    )
);
