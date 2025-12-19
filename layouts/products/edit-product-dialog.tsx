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
import { useUpdateProduct } from "@/lib/hooks/use-products";
import type { Product } from "@/types/api";
import { CategorySelect } from "@/layouts/common/category-select";
import { Loader2, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";

const createProductSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("common.product.nameRequired")),
    initialPrice: z.coerce
      .number()
      .positive(t("common.product.initialPriceRequired"))
      .min(0.01, t("common.product.initialPriceMin")),
    sellingPrice: z.coerce
      .number()
      .positive(t("common.product.sellingPriceRequired"))
      .min(0.01, t("common.product.sellingPriceMin")),
    quantity: z.coerce
      .number()
      .int(t("common.product.quantityRequired"))
      .min(0, t("common.product.quantityMin")),
    categoryId: z.number().nullable().optional(),
  });

type ProductFormValues = {
  name: string;
  initialPrice: number;
  sellingPrice: number;
  quantity: number;
  categoryId: number | null | undefined;
};

interface EditProductDialogProps {
  product: Product;
  trigger?: React.ReactNode;
}

export function EditProductDialog({
  product,
  trigger,
}: EditProductDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const updateProduct = useUpdateProduct();

  const schema = useMemo(() => createProductSchema(t), [t]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: product.name,
      initialPrice: product.initialPrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      categoryId: product.categoryId ?? null,
    },
  });

  // Reset form when dialog opens or product changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: product.name,
        initialPrice: product.initialPrice,
        sellingPrice: product.sellingPrice,
        quantity: product.quantity,
        categoryId: product.categoryId ?? null,
      });
    }
  }, [open, product, form]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: {
          name: data.name,
          initialPrice: data.initialPrice,
          sellingPrice: data.sellingPrice,
          quantity: data.quantity,
          categoryId: data.categoryId,
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
            {t("common.product.edit")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {t("common.product.edit")}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t("common.product.update")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              onSubmit as (data: ProductFormValues) => Promise<void>
            )}
          >
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.product.name")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-11 sm:h-10 text-base sm:text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="initialPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.product.initialPrice")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value || ""}
                        className="h-11 sm:h-10 text-base sm:text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.product.sellingPrice")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value || ""}
                        className="h-11 sm:h-10 text-base sm:text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.product.quantity")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value || ""}
                        className="h-11 sm:h-10 text-base sm:text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.product.category")}
                    </FormLabel>
                    <FormControl>
                      <CategorySelect
                        value={field.value ?? null}
                        onValueChange={field.onChange}
                        placeholder={t("common.product.selectCategory")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                disabled={updateProduct.isPending}
                className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
              >
                {updateProduct.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("common.buttons.saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
