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
            Delete
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Delete Product</DialogTitle>
          <DialogDescription className="space-y-2 text-sm">
            <p>
              Are you sure you want to delete "{productName}"? This action cannot
              be undone.
            </p>
            <p className="text-destructive font-medium">
              All associated sell history will also be permanently deleted.
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
            Cancel
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
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

