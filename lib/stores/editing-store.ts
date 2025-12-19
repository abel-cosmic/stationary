import { create } from "zustand";

interface EditingState {
  editingItems: Record<string, { isEditing: boolean; editValue: string }>;
}

interface EditingActions {
  startEditing: (id: string, initialValue: string) => void;
  stopEditing: (id: string) => void;
  updateEditValue: (id: string, value: string) => void;
  getEditValue: (id: string) => string;
  isEditing: (id: string) => boolean;
  resetEditing: (id: string) => void;
}

const initialState: EditingState = {
  editingItems: {},
};

export const useEditingStore = create<EditingState & EditingActions>(
  (set, get) => ({
    ...initialState,

    startEditing: (id, initialValue) =>
      set((state) => ({
        editingItems: {
          ...state.editingItems,
          [id]: { isEditing: true, editValue: initialValue },
        },
      })),

    stopEditing: (id) =>
      set((state) => {
        const { [id]: _, ...rest } = state.editingItems;
        return { editingItems: rest };
      }),

    updateEditValue: (id, value) =>
      set((state) => {
        const current = state.editingItems[id];
        if (current) {
          return {
            editingItems: {
              ...state.editingItems,
              [id]: { ...current, editValue: value },
            },
          };
        }
        return state;
      }),

    getEditValue: (id) => {
      const state = get();
      return state.editingItems[id]?.editValue ?? "";
    },

    isEditing: (id) => {
      const state = get();
      return state.editingItems[id]?.isEditing ?? false;
    },

    resetEditing: (id) =>
      set((state) => {
        const { [id]: _, ...rest } = state.editingItems;
        return { editingItems: rest };
      }),
  })
);
