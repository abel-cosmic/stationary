"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategorySelect } from "@/layouts/common/category-select";
import { useProducts, useSellProduct } from "@/lib/hooks/use-products";
import type { Product, SellHistory } from "@/types/api";
import { Loader2, ShoppingCart, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  exportDailySellsToExcel,
  generateSalesReport,
} from "@/lib/excel-utils";
import { useAlert } from "@/lib/hooks/use-alert";

interface QuickSellDialogProps {
  trigger?: React.ReactNode;
}

export function QuickSellDialog({ trigger }: QuickSellDialogProps) {
  const { t } = useTranslation();
  const { showAlert, AlertComponent } = useAlert();
  const [open, setOpen] = useState(false);
  const [isExportingDaily, setIsExportingDaily] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const { data: products, isLoading: productsLoading } = useProducts();
  const sellProduct = useSellProduct();

  const sellSchema = useMemo(
    () =>
      z
        .object({
          selectedCategoryId: z.number().nullable().optional(),
          selectedProductId: z.coerce
            .number()
            .int(t("common.validation.productMustBeSelected"))
            .positive(t("common.validation.productMustBeSelected")),
          amount: z.coerce
            .number()
            .int(t("common.validation.amountMustBeInteger"))
            .positive(t("common.validation.amountMustBePositive"))
            .min(1, t("common.validation.amountMustBeAtLeast1")),
          soldPrice: z.coerce
            .number()
            .positive(t("common.validation.sellingPriceMustBePositive"))
            .min(0.01, t("common.validation.sellingPriceMustBeAtLeast001")),
        })
        .superRefine((data, ctx) => {
          if (!products) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("common.validation.productsNotLoaded"),
              path: ["selectedProductId"],
            });
            return;
          }

          const product = products.find((p) => p.id === data.selectedProductId);
          if (!product) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("common.validation.pleaseSelectValidProduct"),
              path: ["selectedProductId"],
            });
            return;
          }

          if (data.amount > product.quantity) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("common.validation.insufficientQuantity"),
              path: ["amount"],
            });
          }
        }),
    [t, products]
  );

  type SellFormValues = z.infer<typeof sellSchema>;

  const form = useForm<SellFormValues>({
    // @ts-expect-error - zodResolver type inference issue with superRefine
    resolver: zodResolver(sellSchema),
    defaultValues: {
      selectedCategoryId: null,
      selectedProductId: 0,
      amount: 0,
      soldPrice: 0,
    },
  });

  const selectedCategoryId = form.watch("selectedCategoryId");
  const selectedProductId = form.watch("selectedProductId");

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!selectedCategoryId) return products;
    return products.filter((p) => p.categoryId === selectedCategoryId);
  }, [products, selectedCategoryId]);

  // Get selected product details
  const selectedProduct = useMemo(() => {
    if (!selectedProductId || !products) return null;
    return products.find((p) => p.id === selectedProductId) || null;
  }, [selectedProductId, products]);

  // Update sold price when product changes
  useEffect(() => {
    if (selectedProduct) {
      form.setValue("soldPrice", selectedProduct.sellingPrice);
    }
  }, [selectedProduct, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset({
        selectedCategoryId: null,
        selectedProductId: 0,
        amount: 0,
        soldPrice: 0,
      });
    }
  }, [open, form]);

  // Update schema when selected product changes
  useEffect(() => {
    if (selectedProduct) {
      form.clearErrors();
    }
  }, [selectedProduct, form]);

  // Get all sell history from products
  const allSellHistory = useMemo(() => {
    if (!products) return [];
    const history: (SellHistory & { product: Product })[] = [];
    products.forEach((product) => {
      if (product.sellHistory && product.sellHistory.length > 0) {
        product.sellHistory.forEach((item) => {
          history.push({
            ...item,
            product,
          });
        });
      }
    });
    // Sort by date, most recent first
    return history.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [products]);

  const onSubmit = async (data: SellFormValues) => {
    if (!selectedProduct) {
      return;
    }

    try {
      await sellProduct.mutateAsync({
        id: data.selectedProductId,
        data: { amount: data.amount, soldPrice: data.soldPrice },
      });
      // Reset form after successful sale
      form.setValue("amount", 0);
      form.setValue("soldPrice", selectedProduct.sellingPrice);
      // Products will automatically refetch due to query invalidation
    } catch (error) {
      console.error("Error selling product:", error);
    }
  };

  const handleExportDaily = async () => {
    if (!products) return;
    setIsExportingDaily(true);
    try {
      exportDailySellsToExcel(allSellHistory, products);
    } catch (error) {
      console.error("Export error:", error);
      await showAlert(t("common.quickSell.exportError"));
    } finally {
      setIsExportingDaily(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!products) return;
    setIsGeneratingReport(true);
    try {
      generateSalesReport(products);
    } catch (error) {
      console.error("Report generation error:", error);
      await showAlert(t("common.quickSell.reportError"));
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {t("common.quickSell.title")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {t("common.quickSell.title")}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t("common.quickSell.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sell Form */}
          <Accordion defaultOpen={true}>
            <div className="border rounded-lg">
              <AccordionTrigger className="px-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-base font-semibold">
                    {t("common.quickSell.sellProduct")}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {selectedProduct && selectedProduct.quantity <= 0 && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm font-medium text-destructive">
                        {t("common.quickSell.noItemsAvailable")}
                      </p>
                      <p className="text-xs text-destructive/80 mt-1">
                        {t("common.quickSell.outOfStockMessage")}
                      </p>
                    </div>
                  )}
                  <Form {...form}>
                    <form
                      // @ts-expect-error - Type inference issue with complex zod schema
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          // @ts-expect-error - Type inference issue with complex zod schema
                          control={form.control}
                          name="selectedCategoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                {t("common.table.category")}
                              </FormLabel>
                              <FormControl>
                                <CategorySelect
                                  value={field.value ?? null}
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    form.setValue("selectedProductId", 0); // Reset product when category changes
                                  }}
                                  placeholder={t(
                                    "common.quickSell.selectCategory"
                                  )}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          // @ts-expect-error - Type inference issue with complex zod schema
                          control={form.control}
                          name="selectedProductId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                {t("common.quickSell.product")}
                              </FormLabel>
                              <FormControl>
                                <Select
                                  value={field.value?.toString() ?? ""}
                                  onValueChange={(value) => {
                                    field.onChange(parseInt(value));
                                  }}
                                  disabled={
                                    !selectedCategoryId ||
                                    filteredProducts.length === 0
                                  }
                                >
                                  <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                                    <SelectValue
                                      placeholder={t(
                                        "common.quickSell.selectProduct"
                                      )}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {productsLoading ? (
                                      <SelectItem value="loading" disabled>
                                        {t("common.quickSell.loading")}
                                      </SelectItem>
                                    ) : filteredProducts.length === 0 ? (
                                      <SelectItem value="none" disabled>
                                        {t(
                                          "common.quickSell.noProductsAvailable"
                                        )}
                                      </SelectItem>
                                    ) : (
                                      filteredProducts.map((product) => (
                                        <SelectItem
                                          key={product.id}
                                          value={product.id.toString()}
                                        >
                                          {product.name} (
                                          {t("common.quickSell.available")}:{" "}
                                          {product.quantity})
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          // @ts-expect-error - Type inference issue with complex zod schema
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
                                  max={selectedProduct?.quantity ?? 0}
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                  value={field.value || ""}
                                  className="h-11 sm:h-10 text-base sm:text-sm"
                                  placeholder={t(
                                    "common.quickSell.enterAmount"
                                  )}
                                  disabled={
                                    !selectedProduct ||
                                    selectedProduct.quantity <= 0
                                  }
                                />
                              </FormControl>
                              {selectedProduct && (
                                <p className="text-xs text-muted-foreground">
                                  {t("common.quickSell.available")}:{" "}
                                  {selectedProduct.quantity}
                                </p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          // @ts-expect-error - Type inference issue with complex zod schema
                          control={form.control}
                          name="soldPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                {t("common.quickSell.pricePerUnit")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                  value={field.value || ""}
                                  className="h-11 sm:h-10 text-base sm:text-sm"
                                  placeholder={t("common.quickSell.enterPrice")}
                                  disabled={
                                    !selectedProduct ||
                                    selectedProduct.quantity <= 0
                                  }
                                />
                              </FormControl>
                              {selectedProduct && (
                                <p className="text-xs text-muted-foreground">
                                  {t("common.quickSell.default")}:{" "}
                                  {selectedProduct.sellingPrice.toFixed(2)} ETB
                                </p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

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
                            <div className="p-3 bg-muted rounded-md border">
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

                      <Button
                        type="submit"
                        disabled={
                          sellProduct.isPending ||
                          !selectedProduct ||
                          (selectedProduct?.quantity ?? 0) <= 0
                        }
                        className="w-full sm:w-auto"
                      >
                        {sellProduct.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {t("common.quickSell.sellProduct")}
                      </Button>
                    </form>
                  </Form>
                </div>
              </AccordionContent>
            </div>
          </Accordion>

          {/* Export & Report Section */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleExportDaily}
              disabled={isExportingDaily || allSellHistory.length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isExportingDaily ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">
                    {t("common.quickSell.exporting")}
                  </span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t("common.quickSell.exportDaily")}
                  </span>
                  <span className="sm:hidden">
                    {t("common.quickSell.dailyExport")}
                  </span>
                </>
              )}
            </Button>

            <Button
              onClick={handleGenerateReport}
              disabled={
                isGeneratingReport || !products || products.length === 0
              }
              variant="outline"
              className="flex items-center gap-2"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">
                    {t("common.quickSell.generating")}
                  </span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t("common.quickSell.generateReport")}
                  </span>
                  <span className="sm:hidden">
                    {t("common.quickSell.report")}
                  </span>
                </>
              )}
            </Button>
          </div>

          {/* Sell History Table */}
          <Accordion defaultOpen={false}>
            <div className="border rounded-lg">
              <AccordionTrigger className="px-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-base font-semibold">
                    {t("common.quickSell.recentSales")}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0">
                {allSellHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("common.sellHistory.noHistory")}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[140px]">
                            {t("common.sellHistory.date")}
                          </TableHead>
                          <TableHead className="hidden sm:table-cell">
                            {t("common.table.category")}
                          </TableHead>
                          <TableHead>{t("common.quickSell.product")}</TableHead>
                          <TableHead className="hidden sm:table-cell">
                            {t("common.table.quantity")}
                          </TableHead>
                          <TableHead className="hidden md:table-cell">
                            {t("common.sellHistory.pricePerUnit")}
                          </TableHead>
                          <TableHead className="min-w-[120px]">
                            {t("common.sellHistory.totalRevenue")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allSellHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span>
                                  {format(
                                    new Date(item.createdAt),
                                    "MMM dd, yyyy"
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground sm:hidden">
                                  {item.product.category?.name ||
                                    t("common.sellHistory.uncategorized")}{" "}
                                  | {t("common.table.qty")}: {item.amount} |{" "}
                                  {t("common.table.price")}:{" "}
                                  {item.soldPrice.toFixed(2)} ETB
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {item.product.category?.name ||
                                t("common.sellHistory.uncategorized")}
                            </TableCell>
                            <TableCell>{item.product.name}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {item.amount}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {item.soldPrice.toFixed(2)} ETB
                            </TableCell>
                            <TableCell className="font-semibold">
                              {item.totalPrice.toFixed(2)} ETB
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </AccordionContent>
            </div>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
    <>
      <AlertComponent />
    </>
  );
}
