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
import { useUpdateProduct } from "@/lib/hooks/use-products";
import { Product } from "@/lib/api";
import { CategorySelect } from "@/components/CategorySelect";
import { Loader2, Edit } from "lucide-react";

interface EditProductDialogProps {
  product: Product;
  trigger?: React.ReactNode;
}

export function EditProductDialog({
  product,
  trigger,
}: EditProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name,
    initialPrice: product.initialPrice.toString(),
    sellingPrice: product.sellingPrice.toString(),
    quantity: product.quantity.toString(),
    categoryId: product.categoryId ?? null,
  });
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    if (open) {
      setFormData({
        name: product.name,
        initialPrice: product.initialPrice.toString(),
        sellingPrice: product.sellingPrice.toString(),
        quantity: product.quantity.toString(),
        categoryId: product.categoryId ?? null,
      });
    }
  }, [open, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: {
          name: formData.name,
          initialPrice: parseFloat(formData.initialPrice),
          sellingPrice: parseFloat(formData.sellingPrice),
          quantity: parseInt(formData.quantity),
          categoryId: formData.categoryId,
        },
      });
      setOpen(false);
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Edit Product</DialogTitle>
          <DialogDescription className="text-sm">
            Update the product information below.
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
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category (Optional)
              </Label>
              <CategorySelect
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
                placeholder="Select a category"
              />
            </div>
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
              disabled={updateProduct.isPending}
              className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
            >
              {updateProduct.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
