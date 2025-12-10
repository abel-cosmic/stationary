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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sell {product.name}</DialogTitle>
          <DialogDescription>
            Enter the amount and price you want to sell. Available:{" "}
            {product.quantity}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                max={product.quantity}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className=""
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soldPrice">
                Selling Price (per unit)
                <span className="text-muted-foreground text-xs ml-2">
                  Default: {product.sellingPrice.toFixed(2)} ETB
                </span>
              </Label>
              <Input
                id="soldPrice"
                type="number"
                step="0.01"
                min="0.01"
                value={soldPrice}
                onChange={(e) => setSoldPrice(e.target.value)}
                className=""
                required
              />
            </div>
            {amount &&
              soldPrice &&
              !isNaN(parseInt(amount)) &&
              !isNaN(parseFloat(soldPrice)) && (
                <div className="p-3 bg-muted rounded-md border">
                  <p className="text-sm text-muted-foreground">Total Revenue:</p>
                  <p className="text-lg font-semibold text-primary">
                    {(parseInt(amount) * parseFloat(soldPrice)).toFixed(2)} ETB
                  </p>
                </div>
              )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className=""
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sellProduct.isPending}
              className=""
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
