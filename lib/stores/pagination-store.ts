import { create } from "zustand";

interface PaginationState {
  pagination: Record<string, { currentPage: number; itemsPerPage: number }>;
}

interface PaginationActions {
  setPage: (tableId: string, page: number) => void;
  setItemsPerPage: (tableId: string, items: number) => void;
  getPagination: (tableId: string) => {
    currentPage: number;
    itemsPerPage: number;
  };
  resetPagination: (tableId: string) => void;
}

const defaultPagination = {
  currentPage: 1,
  itemsPerPage: 25,
};

const initialState: PaginationState = {
  pagination: {},
};

export const usePaginationStore = create<PaginationState & PaginationActions>(
  (set, get) => ({
    ...initialState,

    setPage: (tableId, page) =>
      set((state) => ({
        pagination: {
          ...state.pagination,
          [tableId]: {
            ...(state.pagination[tableId] ?? defaultPagination),
            currentPage: page,
          },
        },
      })),

    setItemsPerPage: (tableId, items) =>
      set((state) => ({
        pagination: {
          ...state.pagination,
          [tableId]: {
            ...(state.pagination[tableId] ?? defaultPagination),
            itemsPerPage: items,
            currentPage: 1, // Reset to first page when changing items per page
          },
        },
      })),

    getPagination: (tableId) => {
      const state = get();
      return state.pagination[tableId] ?? defaultPagination;
    },

    resetPagination: (tableId) =>
      set((state) => {
        const { [tableId]: _, ...rest } = state.pagination;
        return { pagination: rest };
      }),
  })
);
