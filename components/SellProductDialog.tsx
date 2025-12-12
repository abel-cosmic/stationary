"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSellProduct } from "@/lib/hooks/use-products";
import { Product } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SellProductDialogProps {
  product: Product;
  trigger?: React.ReactNode;
}

export function SellProductDialog({
  product,
  trigger,
}: SellProductDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const sellProduct = useSellProduct();

  const createSellProductSchema = (t: (key: string) => string) =>
    z
      .object({
        amount: z.coerce
          .number()
          .int(t("common.product.quantityRequired"))
          .positive(t("common.quickSell.enterAmount"))
          .min(1, t("common.quickSell.enterAmount")),
        soldPrice: z.coerce
          .number()
          .positive(t("common.product.sellingPriceRequired"))
          .min(0.01, t("common.product.sellingPriceMin")),
      })
      .refine((data) => data.amount <= product.quantity, {
        message: t("common.sellProduct.insufficientQuantity"),
        path: ["amount"],
      });

  const sellProductSchema = useMemo(
    () => createSellProductSchema(t),
    [t, product.quantity]
  );

  type SellProductFormValues = z.infer<typeof sellProductSchema>;

  const form = useForm<SellProductFormValues>({
    resolver: zodResolver(sellProductSchema) as any,
    defaultValues: {
      amount: 0,
      soldPrice: product.sellingPrice,
    },
  });

  // Update soldPrice when product prop changes (ensures fresh data)
  useEffect(() => {
    form.setValue("soldPrice", product.sellingPrice);
  }, [product.sellingPrice, form]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      form.reset({
        amount: 0,
        soldPrice: product.sellingPrice,
      });
    }
  }, [open, product.sellingPrice, form]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const onSubmit = async (data: SellProductFormValues) => {
    try {
      await sellProduct.mutateAsync({
        id: product.id,
        data: { amount: data.amount, soldPrice: data.soldPrice },
      });
      setOpen(false);
    } catch (error) {
      console.error("Error selling product:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button>{t("common.sellProduct.sellItem")}</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {t("common.sellProduct.sellProductTitle", { name: product.name })}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t("common.sellProduct.enterAmountAndPrice")} {product.quantity}
          </DialogDescription>
        </DialogHeader>
        {product.quantity <= 0 && (
          <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm font-medium text-destructive">
              {t("common.sellProduct.noItemsAvailable")}
            </p>
            <p className="text-xs text-destructive/80 mt-1">
              {t("common.sellProduct.outOfStock")}
            </p>
          </div>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              onSubmit as (data: SellProductFormValues) => Promise<void>
            )}
          >
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.quickSell.amount")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        max={product.quantity}
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value || ""}
                        className="h-11 sm:h-10 text-base sm:text-sm"
                        disabled={product.quantity <= 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="soldPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.sellProduct.sellingPricePerUnit")}
                    </FormLabel>
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("common.sellProduct.default")}:{" "}
                      {product.sellingPrice.toFixed(2)} ETB
                    </p>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0.01"
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value || ""}
                        className="h-11 sm:h-10 text-base sm:text-sm"
                        disabled={product.quantity <= 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(() => {
                const amount = Number(form.watch("amount"));
                const soldPrice = Number(form.watch("soldPrice"));
                if (
                  amount > 0 &&
                  soldPrice > 0 &&
                  !isNaN(amount) &&
                  !isNaN(soldPrice)
                ) {
                  return (
                    <div className="p-3 sm:p-4 bg-muted rounded-md border">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {t("common.analytics.totalRevenueLabel")}
                      </p>
                      <p className="text-base sm:text-lg font-semibold text-primary">
                        {(amount * soldPrice).toFixed(2)} ETB
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
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
                type="submit"
                disabled={sellProduct.isPending || product.quantity <= 0}
                className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
              >
                {sellProduct.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("common.sellProduct.sell")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
