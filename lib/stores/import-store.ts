import { create } from "zustand";

interface ImportOptions {
  categories: boolean;
  products: boolean;
  sellHistory: boolean;
  analytics: boolean;
}

interface ImportStatus {
  success: number;
  failed: number;
  errors: string[];
}

interface ImportState {
  file: File | null;
  isProcessing: boolean;
  availableSheets: string[];
  importOptions: ImportOptions;
  importStatus: ImportStatus | null;
}

interface ImportActions {
  setFile: (file: File | null) => void;
  setProcessing: (isProcessing: boolean) => void;
  setAvailableSheets: (sheets: string[]) => void;
  updateImportOptions: (options: Partial<ImportOptions>) => void;
  setImportOptions: (options: ImportOptions) => void;
  setImportStatus: (status: ImportStatus | null) => void;
  resetImportState: () => void;
}

const defaultImportOptions: ImportOptions = {
  categories: false,
  products: true,
  sellHistory: false,
  analytics: false,
};

const initialState: ImportState = {
  file: null,
  isProcessing: false,
  availableSheets: [],
  importOptions: defaultImportOptions,
  importStatus: null,
};

export const useImportStore = create<ImportState & ImportActions>((set) => ({
  ...initialState,

  setFile: (file) => set({ file }),

  setProcessing: (isProcessing) => set({ isProcessing }),

  setAvailableSheets: (sheets) => set({ availableSheets: sheets }),

  updateImportOptions: (options) =>
    set((state) => ({
      importOptions: { ...state.importOptions, ...options },
    })),

  setImportOptions: (options) => set({ importOptions: options }),

  setImportStatus: (status) => set({ importStatus: status }),

  resetImportState: () => set(initialState),
}));
