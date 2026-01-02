"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
  variant = "default",
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          <DialogDescription className="text-base">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            {cancelLabel || t("common.buttons.cancel")}
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={handleConfirm}
            className="w-full sm:w-auto"
          >
            {confirmLabel || t("common.buttons.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


