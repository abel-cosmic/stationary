"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CategorySelect } from "@/layouts/common/category-select";
import { useProducts, useBulkSell } from "@/lib/hooks/use-products";
import { useServices } from "@/lib/hooks/use-services";
import { useQuickSellStore } from "@/lib/stores";
import {
  calculateCartTotals,
  createCartItemsFromSelected,
} from "@/lib/services/cart-service";
import {
  getAllSellHistory,
  filterSellHistoryByTab,
  calculateSummaryStats,
  groupSellHistoryByDate,
} from "@/lib/services/sell-service";
import {
  Loader2,
  ShoppingCart,
  Download,
  FileText,
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  X,
  Trash2,
  Edit,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  exportDailySellsToExcel,
  generateSalesReport,
} from "@/lib/excel-utils";
import Link from "next/link";
import { ThemeToggle } from "@/layouts/common/theme-toggle";
import { LanguageToggle } from "@/layouts/common/language-toggle";
import { useTranslation } from "react-i18next";
import { EditSaleDialog } from "@/layouts/quick-sell/edit-sale-dialog";
import { AssignDebitDialog } from "@/layouts/quick-sell/assign-debit-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteSellHistory } from "@/lib/hooks/use-sell-history";
import { useRemoveDebitItem } from "@/lib/hooks/use-debits";

import type { SalesTab, SelectedProduct } from "@/types/quick-sell";

export default function QuickSellPage() {
  const { t } = useTranslation();

  // Zustand store state and actions
  const cart = useQuickSellStore((state) => state.cart);
  const selectedProducts = useQuickSellStore((state) => state.selectedProducts);
  const activeTab = useQuickSellStore((state) => state.activeTab);
  const isExportingDaily = useQuickSellStore((state) => state.isExportingDaily);
  const isGeneratingReport = useQuickSellStore(
    (state) => state.isGeneratingReport
  );

  const addToCart = useQuickSellStore((state) => state.addToCart);
  const removeFromCart = useQuickSellStore((state) => state.removeFromCart);
  const clearCart = useQuickSellStore((state) => state.clearCart);
  const toggleProductSelection = useQuickSellStore(
    (state) => state.toggleProductSelection
  );
  const updateSelectedProduct = useQuickSellStore(
    (state) => state.updateSelectedProduct
  );
  const clearSelectedProducts = useQuickSellStore(
    (state) => state.clearSelectedProducts
  );
  const setSelectedProducts = useQuickSellStore(
    (state) => state.setSelectedProducts
  );
  const setActiveTab = useQuickSellStore((state) => state.setActiveTab);
  const setExportingDaily = useQuickSellStore(
    (state) => state.setExportingDaily
  );
  const setGeneratingReport = useQuickSellStore(
    (state) => state.setGeneratingReport
  );

  const { data: products } = useProducts();
  const { data: services } = useServices();
  const bulkSell = useBulkSell();
  const deleteSellHistory = useDeleteSellHistory();
  const removeDebitItem = useRemoveDebitItem();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<number | null>(null);
  const [markAsSoldConfirmOpen, setMarkAsSoldConfirmOpen] = useState(false);
  const [saleToMarkAsSold, setSaleToMarkAsSold] = useState<number | null>(null);

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
    // @ts-expect-error - zodResolver type inference issue with superRefine and dynamic translations
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

  // Get all sell history using service
  const allSellHistory = useMemo(() => {
    return getAllSellHistory(products, services);
  }, [products, services]);

  // Filter sell history based on active tab using service
  const filteredSellHistory = useMemo(() => {
    return filterSellHistoryByTab(allSellHistory, activeTab);
  }, [allSellHistory, activeTab]);

  // Calculate summary stats using service
  const summaryStats = useMemo(() => {
    return calculateSummaryStats(filteredSellHistory, activeTab);
  }, [filteredSellHistory, activeTab]);

  // Handle product selection with default price
  const handleToggleProductSelection = (productId: number) => {
    const product = products?.find((p) => p.id === productId);
    if (!product) return;

    toggleProductSelection(productId);
    // Set default price if newly selected
    if (!selectedProducts.has(productId)) {
      updateSelectedProduct(productId, "soldPrice", product.sellingPrice);
    }
  };

  // Add all selected products to cart using service
  const addSelectedToCart = () => {
    if (!products || selectedProducts.size === 0) return;

    const newCartItems = createCartItemsFromSelected(
      selectedProducts,
      products
    );

    // Add items to cart (store handles duplicates)
    newCartItems.forEach((item) => addToCart(item));

    // Clear selections
    clearSelectedProducts();
  };

  // Sell all selected products directly
  const sellSelectedProducts = async () => {
    if (!products || selectedProducts.size === 0) return;

    const items = Array.from(selectedProducts.values())
      .filter((selected) => {
        const product = products.find((p) => p.id === selected.productId);
        return (
          product &&
          selected.amount > 0 &&
          selected.soldPrice > 0 &&
          selected.amount <= product.quantity
        );
      })
      .map((selected) => ({
        productId: selected.productId,
        amount: selected.amount,
        soldPrice: selected.soldPrice,
      }));

    if (items.length === 0) return;

    try {
      await bulkSell.mutateAsync({ items });
      clearSelectedProducts();
    } catch (error) {
      console.error("Error selling products:", error);
    }
  };

  // Calculate cart totals using service
  const cartTotals = useMemo(() => {
    return calculateCartTotals(cart);
  }, [cart]);

  // Submit cart as transaction
  const handleSubmitCart = async () => {
    if (cart.length === 0) return;

    try {
      await bulkSell.mutateAsync({
        items: cart.map((item) => ({
          productId: item.productId,
          amount: item.amount,
          soldPrice: item.soldPrice,
        })),
      });
      // Clear cart after successful transaction
      clearCart();
      // Reset form
      form.reset();
    } catch (error) {
      console.error("Error processing transaction:", error);
    }
  };

  const handleExportDaily = async () => {
    if (!products) return;
    setExportingDaily(true);
    try {
      exportDailySellsToExcel(allSellHistory, products);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExportingDaily(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!products) return;
    setGeneratingReport(true);
    try {
      generateSalesReport(products);
    } catch (error) {
      console.error("Report generation error:", error);
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8 flex flex-col gap-3 sm:gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold">
                    {t("common.quickSell.title")}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  {t("common.quickSell.description")}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <Link href="/">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">
                      {t("common.backToHome")}
                    </span>
                    <span className="sm:hidden">{t("common.back")}</span>
                  </Button>
                </Link>
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Sell Form */}
            <Accordion defaultOpen={true}>
              <div className="border rounded-lg">
                <AccordionTrigger className="px-4 sm:px-6">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-base sm:text-lg font-semibold">
                      {t("common.quickSell.sellProduct")}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="space-y-4">
                    {/* Category Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {t("common.table.category")}
                      </label>
                      <CategorySelect
                        value={selectedCategoryId}
                        onValueChange={(value) => {
                          form.setValue("selectedCategoryId", value);
                          clearSelectedProducts(); // Clear selections when category changes
                        }}
                        placeholder={t("common.quickSell.selectCategory")}
                      />
                    </div>

                    {/* Multi-Product Selection */}
                    {selectedCategoryId && filteredProducts.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            {t("common.quickSell.selectMultipleProducts") ||
                              "Select multiple products to sell at once"}
                          </p>
                          {selectedProducts.size > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => clearSelectedProducts()}
                              className="text-xs"
                            >
                              {t("common.quickSell.clearSelection") ||
                                "Clear Selection"}
                            </Button>
                          )}
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto max-h-[400px]">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">
                                    <Checkbox
                                      checked={
                                        filteredProducts.length > 0 &&
                                        filteredProducts.every((p) =>
                                          selectedProducts.has(p.id)
                                        ) &&
                                        filteredProducts.some(
                                          (p) => p.quantity > 0
                                        )
                                      }
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          const newSelected = new Map<
                                            number,
                                            SelectedProduct
                                          >();
                                          filteredProducts.forEach(
                                            (product) => {
                                              if (product.quantity > 0) {
                                                toggleProductSelection(
                                                  product.id
                                                );
                                                updateSelectedProduct(
                                                  product.id,
                                                  "soldPrice",
                                                  product.sellingPrice
                                                );
                                              }
                                            }
                                          );
                                        } else {
                                          clearSelectedProducts();
                                        }
                                      }}
                                      disabled={
                                        !filteredProducts.some(
                                          (p) => p.quantity > 0
                                        )
                                      }
                                    />
                                  </TableHead>
                                  <TableHead>
                                    {t("common.quickSell.product")}
                                  </TableHead>
                                  <TableHead className="hidden sm:table-cell">
                                    {t("common.quickSell.available")}
                                  </TableHead>
                                  <TableHead>
                                    {t("common.quickSell.amount")}
                                  </TableHead>
                                  <TableHead>
                                    {t("common.quickSell.pricePerUnit")}
                                  </TableHead>
                                  <TableHead className="hidden md:table-cell">
                                    {t("common.analytics.totalRevenueLabel")}
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredProducts.map((product) => {
                                  const isSelected = selectedProducts.has(
                                    product.id
                                  );
                                  const selected = selectedProducts.get(
                                    product.id
                                  );
                                  const isOutOfStock = product.quantity <= 0;

                                  return (
                                    <TableRow
                                      key={product.id}
                                      className={cn(
                                        isOutOfStock && "opacity-50"
                                      )}
                                    >
                                      <TableCell>
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() =>
                                            handleToggleProductSelection(
                                              product.id
                                            )
                                          }
                                          disabled={isOutOfStock}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <div>
                                          <p className="font-medium">
                                            {product.name}
                                          </p>
                                          {isOutOfStock && (
                                            <p className="text-xs text-red-500">
                                              {t(
                                                "common.quickSell.noItemsAvailable"
                                              )}
                                            </p>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="hidden sm:table-cell">
                                        {product.quantity}
                                      </TableCell>
                                      <TableCell>
                                        {isSelected ? (
                                          <Input
                                            type="number"
                                            min="1"
                                            max={product.quantity}
                                            value={selected?.amount || 1}
                                            onChange={(e) => {
                                              const value =
                                                parseInt(e.target.value) || 1;
                                              updateSelectedProduct(
                                                product.id,
                                                "amount",
                                                Math.min(
                                                  value,
                                                  product.quantity
                                                )
                                              );
                                            }}
                                            className="h-9 w-20"
                                            disabled={isOutOfStock}
                                          />
                                        ) : (
                                          <span className="text-sm text-muted-foreground">
                                            -
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {isSelected ? (
                                          <Input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={selected?.soldPrice || 0}
                                            onChange={(e) => {
                                              const value =
                                                parseFloat(e.target.value) || 0;
                                              updateSelectedProduct(
                                                product.id,
                                                "soldPrice",
                                                value
                                              );
                                            }}
                                            className="h-9 w-24"
                                            disabled={isOutOfStock}
                                            placeholder={product.sellingPrice.toFixed(
                                              2
                                            )}
                                          />
                                        ) : (
                                          <span className="text-sm text-muted-foreground">
                                            {product.sellingPrice.toFixed(2)}{" "}
                                            ETB
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="hidden md:table-cell">
                                        {isSelected && selected ? (
                                          <span className="font-medium">
                                            {(
                                              selected.amount *
                                              selected.soldPrice
                                            ).toFixed(2)}{" "}
                                            ETB
                                          </span>
                                        ) : (
                                          <span className="text-sm text-muted-foreground">
                                            -
                                          </span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        {/* Selected Products Summary and Actions */}
                        {selectedProducts.size > 0 && (
                          <div className="space-y-3">
                            <div className="p-3 bg-muted rounded-md border">
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-medium">
                                  {t("common.quickSell.selectedProducts") ||
                                    "Selected Products"}{" "}
                                  ({selectedProducts.size})
                                </p>
                                <p className="text-sm font-semibold text-primary">
                                  {Array.from(selectedProducts.values())
                                    .reduce((sum, selected) => {
                                      return (
                                        sum +
                                        selected.amount * selected.soldPrice
                                      );
                                    }, 0)
                                    .toFixed(2)}{" "}
                                  ETB
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="default"
                                onClick={addSelectedToCart}
                                className="flex-1"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                {t("common.quickSell.addSelectedToCart") ||
                                  "Add Selected to Cart"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={sellSelectedProducts}
                                disabled={bulkSell.isPending}
                                className="flex-1"
                              >
                                {bulkSell.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {t("common.quickSell.sellSelected") ||
                                  "Sell Selected"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : selectedCategoryId && filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">
                          {t("common.quickSell.noProductsAvailable")}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">
                          {t("common.quickSell.selectCategoryFirst") ||
                            "Please select a category to view products"}
                        </p>
                      </div>
                    )}

                    {/* Cart Section - Always visible */}
                    <div className="mt-6 border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <ShoppingCart className="h-5 w-5" />
                          {t("common.quickSell.cart") || "Cart"}
                          {cart.length > 0 && ` (${cart.length})`}
                        </h3>
                        {cart.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearCart}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("common.quickSell.clearCart") || "Clear Cart"}
                          </Button>
                        )}
                      </div>

                      {cart.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                          <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm font-medium mb-1">
                            {t("common.quickSell.emptyCart") ||
                              "Your cart is empty"}
                          </p>
                          <p className="text-xs">
                            {t("common.quickSell.addProductsHint") ||
                              "Select products above and click 'Add to Cart' to build your transaction"}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            {cart.map((item) => (
                              <div
                                key={item.productId}
                                className="flex items-center justify-between p-3 bg-muted rounded-md"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {item.product.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.amount} × {item.soldPrice.toFixed(2)}{" "}
                                    ETB ={" "}
                                    {(item.amount * item.soldPrice).toFixed(2)}{" "}
                                    ETB
                                  </p>
                                  {item.product.category && (
                                    <p className="text-xs text-muted-foreground">
                                      {item.product.category.name}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromCart(item.productId)}
                                  className="ml-2 text-destructive hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>

                          <div className="pt-4 border-t space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {t("common.quickSell.totalItems") ||
                                  "Total Items"}
                                :
                              </span>
                              <span className="font-medium">
                                {cartTotals.totalQuantity}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {t("common.analytics.totalRevenueLabel")}:
                              </span>
                              <span className="font-semibold text-primary">
                                {cartTotals.totalRevenue.toFixed(2)} ETB
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {t("common.analytics.totalProfit")}:
                              </span>
                              <span className="font-semibold text-green-400">
                                {cartTotals.totalProfit.toFixed(2)} ETB
                              </span>
                            </div>
                            <Button
                              onClick={handleSubmitCart}
                              disabled={bulkSell.isPending || cart.length === 0}
                              className="w-full mt-4"
                              size="lg"
                            >
                              {bulkSell.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              {t("common.quickSell.completeTransaction") ||
                                "Complete Transaction"}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
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
                      {t("common.export.exporting")}
                    </span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {t("common.quickSell.exportDaily")}
                    </span>
                    <span className="sm:hidden">
                      {t("common.export.export")}
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

            {/* Sales History with Tabs */}
            <Accordion defaultOpen={false}>
              <div className="border rounded-lg">
                <AccordionTrigger className="px-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-base sm:text-lg font-semibold">
                      {t("common.quickSell.salesHistory")}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0">
                  <div className="p-4 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Tab Switcher */}
                      <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
                        <Button
                          variant={activeTab === "today" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setActiveTab("today")}
                          className={cn(
                            "h-9 px-3 text-sm",
                            activeTab === "today"
                              ? "bg-background shadow-sm"
                              : ""
                          )}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          {t("common.quickSell.today")}
                        </Button>
                        <Button
                          variant={activeTab === "weekly" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setActiveTab("weekly")}
                          className={cn(
                            "h-9 px-3 text-sm",
                            activeTab === "weekly"
                              ? "bg-background shadow-sm"
                              : ""
                          )}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          {t("common.quickSell.weekly")}
                        </Button>
                        <Button
                          variant={
                            activeTab === "allTime" ? "default" : "ghost"
                          }
                          size="sm"
                          onClick={() => setActiveTab("allTime")}
                          className={cn(
                            "h-9 px-3 text-sm",
                            activeTab === "allTime"
                              ? "bg-background shadow-sm"
                              : ""
                          )}
                        >
                          {t("common.quickSell.allTime")}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {filteredSellHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t("common.quickSell.noSalesHistoryFor")}{" "}
                      {activeTab === "today"
                        ? t("common.quickSell.today")
                        : activeTab === "weekly"
                        ? t("common.quickSell.last7Days")
                        : t("common.quickSell.thisPeriod")}
                    </div>
                  ) : activeTab === "today" ? (
                    // Today Tab - Detailed Table with Product Info
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[180px]">
                              {t("common.sellHistory.dateTime")}
                            </TableHead>
                            <TableHead className="hidden sm:table-cell">
                              {t("common.table.category")}
                            </TableHead>
                            <TableHead>
                              {t("common.quickSell.product")}
                            </TableHead>
                            <TableHead className="hidden sm:table-cell">
                              {t("common.table.quantity")}
                            </TableHead>
                            <TableHead className="hidden md:table-cell">
                              {t("common.sellHistory.pricePerUnit")}
                            </TableHead>
                            <TableHead className="min-w-[120px]">
                              {t("common.sellHistory.totalRevenue")}
                            </TableHead>
                            <TableHead className="hidden md:table-cell min-w-[120px]">
                              {t("common.excel.paymentStatus") ||
                                "Payment Status"}
                            </TableHead>
                            <TableHead className="w-[150px]">
                              {t("common.quickSell.actions") || "Actions"}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSellHistory.map((item) => {
                            const isService =
                              !!item.serviceId && !!item.service;
                            const isProduct =
                              !!item.productId && !!item.product;
                            const name = isService
                              ? item.service?.name
                              : item.product?.name;
                            const category = isProduct
                              ? item.product?.category?.name
                              : null;
                            const hasDebit = !!item.debitItem;
                            const debitStatus = item.debitItem?.debit?.status;
                            const paymentStatus = hasDebit
                              ? debitStatus === "PAID"
                                ? "Paid"
                                : debitStatus === "PARTIAL"
                                ? "Partial"
                                : "Pending"
                              : "Sold";

                            return (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium">
                                      {format(
                                        new Date(item.createdAt),
                                        "MMM dd, yyyy"
                                      )}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {format(
                                        new Date(item.createdAt),
                                        "HH:mm:ss"
                                      )}
                                    </span>
                                    <span className="text-xs text-muted-foreground sm:hidden">
                                      {isService
                                        ? t("common.service.service") ||
                                          "Service"
                                        : category ||
                                          t(
                                            "common.sellHistory.uncategorized"
                                          )}{" "}
                                      | {t("common.table.qty")}: {item.amount} |{" "}
                                      {t("common.table.price")}:{" "}
                                      {item.soldPrice.toFixed(2)} ETB
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  {isService ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium">
                                      {t("common.service.service") || "Service"}
                                    </span>
                                  ) : (
                                    category ||
                                    t("common.sellHistory.uncategorized")
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {name}
                                    {isService && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium">
                                        {t("common.service.service") ||
                                          "Service"}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  {item.amount}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {item.soldPrice.toFixed(2)} ETB
                                </TableCell>
                                <TableCell className="font-semibold">
                                  {item.totalPrice.toFixed(2)} ETB
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <span
                                    className={cn(
                                      "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
                                      paymentStatus === "Sold" &&
                                        "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
                                      paymentStatus === "Paid" &&
                                        "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
                                      paymentStatus === "Partial" &&
                                        "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
                                      paymentStatus === "Pending" &&
                                        "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                                    )}
                                  >
                                    {paymentStatus}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <EditSaleDialog
                                      sellHistory={item}
                                      trigger={
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          title={
                                            t("common.quickSell.edit") || "Edit"
                                          }
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      }
                                    />
                                    {!hasDebit ? (
                                      <AssignDebitDialog
                                        sellHistory={item}
                                        trigger={
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            title={
                                              t(
                                                "common.quickSell.assignToDebit"
                                              ) || "Assign to Debit"
                                            }
                                          >
                                            <CreditCard className="h-4 w-4" />
                                          </Button>
                                        }
                                      />
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 dark:text-green-400"
                                        onClick={() => {
                                          setSaleToMarkAsSold(item.id);
                                          setMarkAsSoldConfirmOpen(true);
                                        }}
                                        disabled={removeDebitItem.isPending}
                                        title={
                                          t("common.quickSell.markAsSold") ||
                                          "Mark as Sold"
                                        }
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                      onClick={() => {
                                        setSaleToDelete(item.id);
                                        setDeleteConfirmOpen(true);
                                      }}
                                      disabled={deleteSellHistory.isPending}
                                      title={
                                        t("common.buttons.delete") || "Delete"
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    // Weekly and All Time Tabs - Individual Sales Table
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[180px]">
                              {t("common.sellHistory.dateTime")}
                            </TableHead>
                            <TableHead className="hidden sm:table-cell">
                              {t("common.table.category")}
                            </TableHead>
                            <TableHead>
                              {t("common.quickSell.product")}
                            </TableHead>
                            <TableHead className="hidden sm:table-cell">
                              {t("common.table.quantity")}
                            </TableHead>
                            <TableHead className="hidden md:table-cell">
                              {t("common.sellHistory.pricePerUnit")}
                            </TableHead>
                            <TableHead className="min-w-[120px]">
                              {t("common.sellHistory.totalRevenue")}
                            </TableHead>
                            <TableHead className="hidden md:table-cell min-w-[120px]">
                              {t("common.excel.paymentStatus") ||
                                "Payment Status"}
                            </TableHead>
                            <TableHead className="w-[150px]">
                              {t("common.quickSell.actions") || "Actions"}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSellHistory.map((item) => {
                            const isService =
                              !!item.serviceId && !!item.service;
                            const isProduct =
                              !!item.productId && !!item.product;
                            const name = isService
                              ? item.service?.name
                              : item.product?.name;
                            const category = isProduct
                              ? item.product?.category?.name
                              : null;
                            const hasDebit = !!item.debitItem;
                            const debitStatus = item.debitItem?.debit?.status;
                            const paymentStatus = hasDebit
                              ? debitStatus === "PAID"
                                ? "Paid"
                                : debitStatus === "PARTIAL"
                                ? "Partial"
                                : "Pending"
                              : "Sold";

                            return (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium">
                                      {format(
                                        new Date(item.createdAt),
                                        "MMM dd, yyyy"
                                      )}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {format(
                                        new Date(item.createdAt),
                                        "HH:mm:ss"
                                      )}
                                    </span>
                                    <span className="text-xs text-muted-foreground sm:hidden">
                                      {isService
                                        ? t("common.service.service") ||
                                          "Service"
                                        : category ||
                                          t(
                                            "common.sellHistory.uncategorized"
                                          )}{" "}
                                      | {t("common.table.qty")}: {item.amount} |{" "}
                                      {t("common.table.price")}:{" "}
                                      {item.soldPrice.toFixed(2)} ETB
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  {isService ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium">
                                      {t("common.service.service") || "Service"}
                                    </span>
                                  ) : (
                                    category ||
                                    t("common.sellHistory.uncategorized")
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {name}
                                    {isService && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium">
                                        {t("common.service.service") ||
                                          "Service"}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  {item.amount}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {item.soldPrice.toFixed(2)} ETB
                                </TableCell>
                                <TableCell className="font-semibold">
                                  {item.totalPrice.toFixed(2)} ETB
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <span
                                    className={cn(
                                      "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
                                      paymentStatus === "Sold" &&
                                        "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
                                      paymentStatus === "Paid" &&
                                        "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
                                      paymentStatus === "Partial" &&
                                        "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
                                      paymentStatus === "Pending" &&
                                        "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                                    )}
                                  >
                                    {paymentStatus}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <EditSaleDialog
                                      sellHistory={item}
                                      trigger={
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          title={
                                            t("common.quickSell.edit") || "Edit"
                                          }
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      }
                                    />
                                    {!hasDebit ? (
                                      <AssignDebitDialog
                                        sellHistory={item}
                                        trigger={
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            title={
                                              t(
                                                "common.quickSell.assignToDebit"
                                              ) || "Assign to Debit"
                                            }
                                          >
                                            <CreditCard className="h-4 w-4" />
                                          </Button>
                                        }
                                      />
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 dark:text-green-400"
                                        onClick={() => {
                                          setSaleToMarkAsSold(item.id);
                                          setMarkAsSoldConfirmOpen(true);
                                        }}
                                        disabled={removeDebitItem.isPending}
                                        title={
                                          t("common.quickSell.markAsSold") ||
                                          "Mark as Sold"
                                        }
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                      onClick={() => {
                                        setSaleToDelete(item.id);
                                        setDeleteConfirmOpen(true);
                                      }}
                                      disabled={deleteSellHistory.isPending}
                                      title={
                                        t("common.buttons.delete") || "Delete"
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </AccordionContent>
              </div>
            </Accordion>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t("common.quickSell.deleteSale") || "Delete Sale"}
        message={
          t("common.quickSell.deleteSaleConfirm") ||
          "Are you sure you want to delete this sale? This action cannot be undone and will restore the product quantity."
        }
        variant="destructive"
        confirmLabel={t("common.buttons.delete") || "Delete"}
        cancelLabel={t("common.buttons.cancel") || "Cancel"}
        onConfirm={async () => {
          if (saleToDelete) {
            try {
              await deleteSellHistory.mutateAsync(saleToDelete);
              setSaleToDelete(null);
            } catch (error) {
              console.error("Error deleting sale:", error);
            }
          }
        }}
        onCancel={() => {
          setSaleToDelete(null);
        }}
      />
      <ConfirmDialog
        open={markAsSoldConfirmOpen}
        onOpenChange={setMarkAsSoldConfirmOpen}
        title={t("common.quickSell.markAsSold") || "Mark as Sold"}
        message={
          t("common.quickSell.markAsSoldConfirm") ||
          "Are you sure you want to mark this sale as sold? This will remove it from the debit."
        }
        variant="default"
        confirmLabel={t("common.buttons.save") || "Mark as Sold"}
        cancelLabel={t("common.buttons.cancel") || "Cancel"}
        onConfirm={async () => {
          if (saleToMarkAsSold) {
            try {
              await removeDebitItem.mutateAsync(saleToMarkAsSold);
              setSaleToMarkAsSold(null);
            } catch (error) {
              console.error("Error marking as sold:", error);
            }
          }
        }}
        onCancel={() => {
          setSaleToMarkAsSold(null);
        }}
      />
    </>
  );
}
