"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateProduct } from "@/lib/hooks/use-products";
import { CategorySelect } from "@/components/CategorySelect";
import { Loader2, Plus } from "lucide-react";

interface CreateProductDialogProps {
  trigger?: React.ReactNode;
  categoryId?: number;
}

export function CreateProductDialog({
  trigger,
  categoryId,
}: CreateProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    initialPrice: "",
    sellingPrice: "",
    quantity: "",
    categoryId: categoryId ?? null,
  });
  const createProduct = useCreateProduct();

  // Update categoryId when prop changes
  useEffect(() => {
    if (categoryId !== undefined) {
      setFormData((prev) => ({ ...prev, categoryId: categoryId ?? null }));
    }
  }, [categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createProduct.mutateAsync({
        name: formData.name,
        initialPrice: parseFloat(formData.initialPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        quantity: parseInt(formData.quantity),
        categoryId: formData.categoryId,
      });
      setFormData({
        name: "",
        initialPrice: "",
        sellingPrice: "",
        quantity: "",
        categoryId: categoryId ?? null,
      });
      setOpen(false);
    } catch (error) {
      console.error("Error creating product:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Create New Product
          </DialogTitle>
          <DialogDescription className="text-sm">
            Add a new product to your inventory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="h-11 sm:h-10 text-base sm:text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initialPrice" className="text-sm font-medium">
                Initial Price
              </Label>
              <Input
                id="initialPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.initialPrice}
                onChange={(e) =>
                  setFormData({ ...formData, initialPrice: e.target.value })
                }
                className="h-11 sm:h-10 text-base sm:text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellingPrice" className="text-sm font-medium">
                Selling Price
              </Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.sellingPrice}
                onChange={(e) =>
                  setFormData({ ...formData, sellingPrice: e.target.value })
                }
                className="h-11 sm:h-10 text-base sm:text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                className="h-11 sm:h-10 text-base sm:text-sm"
                required
              />
            </div>
            {categoryId === undefined && (
              <div className="space-y-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <CategorySelect
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                  placeholder="Select a category"
                />
              </div>
            )}
          </div>
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
              type="submit"
              disabled={createProduct.isPending}
              className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
            >
              {createProduct.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
