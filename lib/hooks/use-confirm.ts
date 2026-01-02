"use client";

import { useState, useCallback, useRef } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ConfirmState {
  open: boolean;
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    message: "",
  });
  const resolveRef = useRef<((result: boolean) => void) | null>(null);

  const showConfirm = useCallback(
    (
      message: string,
      options?: {
        title?: string;
        confirmLabel?: string;
        cancelLabel?: string;
        variant?: "default" | "destructive";
      }
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        setConfirmState({
          open: true,
          message,
          title: options?.title,
          confirmLabel: options?.confirmLabel,
          cancelLabel: options?.cancelLabel,
          variant: options?.variant || "default",
        });
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, open: false }));
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, open: false }));
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  const ConfirmComponent = () => (
    <ConfirmDialog
      open={confirmState.open}
      onOpenChange={(open) => {
        if (!open) {
          handleCancel();
        }
      }}
      title={confirmState.title}
      message={confirmState.message}
      confirmLabel={confirmState.confirmLabel}
      cancelLabel={confirmState.cancelLabel}
      variant={confirmState.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return {
    showConfirm,
    ConfirmComponent,
  };
}


