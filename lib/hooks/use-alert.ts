"use client";

import { useState, useCallback, useRef } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface AlertState {
  open: boolean;
  message: string;
  title?: string;
}

export function useAlert() {
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
  });
  const resolveRef = useRef<(() => void) | null>(null);

  const showAlert = useCallback(
    (message: string, title?: string): Promise<void> => {
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        setAlertState({
          open: true,
          message,
          title,
        });
      });
    },
    []
  );

  const handleClose = useCallback(() => {
    setAlertState((prev) => ({ ...prev, open: false }));
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  }, []);

  const AlertComponent = () => (
    <AlertDialog
      open={alertState.open}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      title={alertState.title}
      message={alertState.message}
      onConfirm={handleClose}
    />
  );

  return {
    showAlert,
    AlertComponent,
  };
}


