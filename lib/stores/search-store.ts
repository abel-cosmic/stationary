import { create } from "zustand";

interface SearchState {
  queries: Record<string, string>;
}

interface SearchActions {
  setSearchQuery: (context: string, query: string) => void;
  getSearchQuery: (context: string) => string;
  clearSearch: (context: string) => void;
  resetAllSearches: () => void;
}

const initialState: SearchState = {
  queries: {},
};

export const useSearchStore = create<SearchState & SearchActions>(
  (set, get) => ({
    ...initialState,

    setSearchQuery: (context, query) =>
      set((state) => ({
        queries: { ...state.queries, [context]: query },
      })),

    getSearchQuery: (context) => {
      const state = get();
      return state.queries[context] ?? "";
    },

    clearSearch: (context) =>
      set((state) => {
        const { [context]: _, ...rest } = state.queries;
        return { queries: rest };
      }),

    resetAllSearches: () => set({ queries: {} }),
  })
);
