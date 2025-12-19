import { useDialogStore } from "@/lib/stores";

/**
 * Custom hook for managing dialog state
 * Provides convenient access to dialog store actions
 */
export function useDialog(dialogId: string) {
  const isOpen = useDialogStore((state) => state.isDialogOpen(dialogId));
  const openDialog = useDialogStore((state) => state.openDialog);
  const closeDialog = useDialogStore((state) => state.closeDialog);
  const toggleDialog = useDialogStore((state) => state.toggleDialog);
  const resetDialog = useDialogStore((state) => state.resetDialog);

  return {
    isOpen,
    open: () => openDialog(dialogId),
    close: () => closeDialog(dialogId),
    toggle: () => toggleDialog(dialogId),
    reset: () => resetDialog(dialogId),
  };
}
