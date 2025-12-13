"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteProduct } from "@/lib/hooks/use-products";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DeleteButtonProps {
  productId: number;
  productName: string;
  trigger?: React.ReactNode;
}

export function DeleteButton({
  productId,
  productName,
  trigger,
}: DeleteButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const deleteProduct = useDeleteProduct();
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(productId);
      setOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="destructive"
            className=""
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("common.buttons.delete")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{t("common.product.delete")}</DialogTitle>
          <DialogDescription className="space-y-2 text-sm">
            <p>
              {t("common.product.deleteConfirm", { name: productName })}
            </p>
            <p className="text-destructive font-medium">
              {t("common.product.deleteWarning")}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
          >
            {t("common.buttons.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteProduct.isPending}
            className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
          >
            {deleteProduct.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("common.buttons.deletePermanently")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
