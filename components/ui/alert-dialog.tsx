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

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
  onConfirm?: () => void;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  message,
  onConfirm,
}: AlertDialogProps) {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          <DialogDescription className="text-base">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleConfirm} className="w-full sm:w-auto">
            {t("common.buttons.ok") || "OK"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


