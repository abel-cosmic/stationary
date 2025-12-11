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
import { useSellProduct } from "@/lib/hooks/use-products";
import { Product } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface SellProductDialogProps {
  product: Product;
  trigger?: React.ReactNode;
}

export function SellProductDialog({
  product,
  trigger,
}: SellProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [soldPrice, setSoldPrice] = useState(product.sellingPrice.toString());
  const sellProduct = useSellProduct();

  // Update soldPrice when product prop changes (ensures fresh data)
  useEffect(() => {
    setSoldPrice(product.sellingPrice.toString());
  }, [product.sellingPrice]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when dialog closes
      setAmount("");
      setSoldPrice(product.sellingPrice.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(amount);
    const soldPriceNum = parseFloat(soldPrice);

    if (isNaN(amountNum) || amountNum <= 0) {
      return;
    }

    if (isNaN(soldPriceNum) || soldPriceNum <= 0) {
      alert("Please enter a valid selling price");
      return;
    }

    if (amountNum > product.quantity) {
      alert("Insufficient quantity available");
      return;
    }

    try {
      await sellProduct.mutateAsync({
        id: product.id,
        data: { amount: amountNum, soldPrice: soldPriceNum },
      });
      // Reset form and close dialog
      setAmount("");
      setSoldPrice(product.sellingPrice.toString());
      setOpen(false);
      // The query will automatically refetch due to invalidation in the hook
    } catch (error) {
      console.error("Error selling product:", error);
      alert("Failed to sell product. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            Sell Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Sell {product.name}</DialogTitle>
          <DialogDescription className="text-sm">
            Enter the amount and price you want to sell. Available:{" "}
            {product.quantity}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                max={product.quantity}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 sm:h-10 text-base sm:text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soldPrice" className="text-sm font-medium">
                Selling Price (per unit)
              </Label>
              <p className="text-xs text-muted-foreground mb-1">
                Default: {product.sellingPrice.toFixed(2)} ETB
              </p>
              <Input
                id="soldPrice"
                type="number"
                step="0.01"
                min="0.01"
                value={soldPrice}
                onChange={(e) => setSoldPrice(e.target.value)}
                className="h-11 sm:h-10 text-base sm:text-sm"
                required
              />
            </div>
            {amount &&
              soldPrice &&
              !isNaN(parseInt(amount)) &&
              !isNaN(parseFloat(soldPrice)) && (
                <div className="p-3 sm:p-4 bg-muted rounded-md border">
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Revenue:</p>
                  <p className="text-base sm:text-lg font-semibold text-primary">
                    {(parseInt(amount) * parseFloat(soldPrice)).toFixed(2)} ETB
                  </p>
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
              disabled={sellProduct.isPending}
              className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
            >
              {sellProduct.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sell
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
