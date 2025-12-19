import { create } from "zustand";
import type { Service } from "@/types/api";

interface DialogState {
  dialogs: Record<string, boolean>;
  editingService: Service | null;
}

interface DialogActions {
  openDialog: (id: string) => void;
  closeDialog: (id: string) => void;
  toggleDialog: (id: string) => void;
  isDialogOpen: (id: string) => boolean;
  setEditingService: (service: Service | null) => void;
  resetDialog: (id: string) => void;
}

const initialState: DialogState = {
  dialogs: {},
  editingService: null,
};

export const useDialogStore = create<DialogState & DialogActions>(
  (set, get) => ({
    ...initialState,

    openDialog: (id) =>
      set((state) => ({
        dialogs: { ...state.dialogs, [id]: true },
      })),

    closeDialog: (id) =>
      set((state) => ({
        dialogs: { ...state.dialogs, [id]: false },
      })),

    toggleDialog: (id) =>
      set((state) => ({
        dialogs: { ...state.dialogs, [id]: !state.dialogs[id] },
      })),

    isDialogOpen: (id) => get().dialogs[id] ?? false,

    setEditingService: (service) => set({ editingService: service }),

    resetDialog: (id) =>
      set((state) => {
        const { [id]: _, ...rest } = state.dialogs;
        return { dialogs: rest };
      }),
  })
);
