"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { CategorySelect } from "@/components/CategorySelect";
import { useProducts, useSellProduct } from "@/lib/hooks/use-products";
import { Product, SellHistory } from "@/lib/api";
import {
  Loader2,
  ShoppingCart,
  Download,
  FileText,
  ArrowLeft,
  Calendar,
  Clock,
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
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "react-i18next";

type SalesTab = "today" | "weekly" | "allTime";

export default function QuickSellPage() {
  const { t } = useTranslation();
  const [isExportingDaily, setIsExportingDaily] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState<SalesTab>("today");

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

  // Filter sell history based on active tab
  const filteredSellHistory = useMemo(() => {
    if (!allSellHistory.length) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    switch (activeTab) {
      case "today":
        return allSellHistory.filter((item) => {
          const saleDate = new Date(item.createdAt);
          const saleDateOnly = new Date(
            saleDate.getFullYear(),
            saleDate.getMonth(),
            saleDate.getDate()
          );
          return saleDateOnly.getTime() === today.getTime();
        });
      case "weekly":
        return allSellHistory.filter(
          (item) => new Date(item.createdAt) >= weekAgo
        );
      case "allTime":
        return allSellHistory;
      default:
        return [];
    }
  }, [allSellHistory, activeTab]);

  // Calculate summary stats for weekly and all time
  const summaryStats = useMemo(() => {
    if (activeTab === "today") return null;

    const totalRevenue = filteredSellHistory.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    const totalQuantity = filteredSellHistory.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const totalProfit = filteredSellHistory.reduce((sum, item) => {
      const initialCost = item.product.initialPrice * item.amount;
      return sum + (item.totalPrice - initialCost);
    }, 0);
    const totalTransactions = filteredSellHistory.length;

    return {
      totalRevenue,
      totalQuantity,
      totalProfit,
      totalTransactions,
      averageRevenue:
        totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
    };
  }, [filteredSellHistory, activeTab]);

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

  const handleExportDaily = () => {
    if (!products) return;
    setIsExportingDaily(true);
    try {
      exportDailySellsToExcel(allSellHistory, products);
    } catch (error) {
      console.error("Export error:", error);
      alert(t("common.quickSell.exportError"));
    } finally {
      setIsExportingDaily(false);
    }
  };

  const handleGenerateReport = () => {
    if (!products) return;
    setIsGeneratingReport(true);
    try {
      generateSalesReport(products);
    } catch (error) {
      console.error("Report generation error:", error);
      alert(t("common.quickSell.reportError"));
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
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
                  {selectedProduct && selectedProduct.quantity <= 0 && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm font-medium text-destructive">
                        {t("common.quickSell.noItemsAvailable")}
                      </p>
                      <p className="text-xs text-destructive/80 mt-1">
                        {t("common.sellProduct.outOfStock")}
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
                          // @ts-expect-error - Type inference issue with complex zod schema and dynamic translations
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
                                    (selectedProduct?.quantity ?? 0) <= 0
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
                                    (selectedProduct?.quantity ?? 0) <= 0
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
                    {t("common.export.exporting")}
                  </span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t("common.quickSell.exportDaily")}
                  </span>
                  <span className="sm:hidden">{t("common.export.export")}</span>
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
                          activeTab === "today" ? "bg-background shadow-sm" : ""
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
                        variant={activeTab === "allTime" ? "default" : "ghost"}
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
                        {filteredSellHistory.map((item) => (
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
                                  {format(new Date(item.createdAt), "HH:mm:ss")}
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
                ) : (
                  // Weekly and All Time Tabs - Summary Table
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[180px]">
                            {t("common.sellHistory.date")}
                          </TableHead>
                          <TableHead className="hidden sm:table-cell">
                            {t("common.sellHistory.transactions")}
                          </TableHead>
                          <TableHead>
                            {t("common.sellHistory.itemsSold")}
                          </TableHead>
                          <TableHead className="min-w-[140px]">
                            {t("common.sellHistory.totalRevenue")}
                          </TableHead>
                          <TableHead className="hidden md:table-cell min-w-[140px]">
                            {t("common.analytics.totalProfit")}
                          </TableHead>
                          <TableHead className="hidden lg:table-cell min-w-[140px]">
                            {t("common.sellHistory.avgRevenuePerSale")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          // Group by date for weekly and all time
                          const groupedByDate = new Map<
                            string,
                            {
                              date: string;
                              transactions: number;
                              quantity: number;
                              revenue: number;
                              profit: number;
                            }
                          >();

                          filteredSellHistory.forEach((item) => {
                            const dateKey = format(
                              new Date(item.createdAt),
                              "yyyy-MM-dd"
                            );
                            const displayDate = format(
                              new Date(item.createdAt),
                              "MMM dd, yyyy"
                            );

                            if (!groupedByDate.has(dateKey)) {
                              groupedByDate.set(dateKey, {
                                date: displayDate,
                                transactions: 0,
                                quantity: 0,
                                revenue: 0,
                                profit: 0,
                              });
                            }

                            const dayStats = groupedByDate.get(dateKey)!;
                            dayStats.transactions += 1;
                            dayStats.quantity += item.amount;
                            dayStats.revenue += item.totalPrice;
                            dayStats.profit +=
                              item.totalPrice -
                              item.product.initialPrice * item.amount;
                          });

                          return Array.from(groupedByDate.values())
                            .sort((a, b) => {
                              // Sort by date descending
                              return (
                                new Date(b.date).getTime() -
                                new Date(a.date).getTime()
                              );
                            })
                            .map((dayStats, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium">
                                      {dayStats.date}
                                    </span>
                                    <span className="text-xs text-muted-foreground sm:hidden">
                                      {dayStats.transactions}{" "}
                                      {t("common.sellHistory.transactions")} |{" "}
                                      {dayStats.quantity}{" "}
                                      {t("common.sellHistory.itemsSold")}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  {dayStats.transactions}
                                </TableCell>
                                <TableCell>{dayStats.quantity}</TableCell>
                                <TableCell className="font-semibold">
                                  {dayStats.revenue.toFixed(2)} ETB
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {dayStats.profit.toFixed(2)} ETB
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  {dayStats.transactions > 0
                                    ? (
                                        dayStats.revenue / dayStats.transactions
                                      ).toFixed(2)
                                    : "0.00"}{" "}
                                  ETB
                                </TableCell>
                              </TableRow>
                            ));
                        })()}
                        {/* Summary Row */}
                        {summaryStats && (
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell>
                              <span className="text-base">
                                {t("common.analytics.total")}
                              </span>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {summaryStats.totalTransactions}
                            </TableCell>
                            <TableCell>{summaryStats.totalQuantity}</TableCell>
                            <TableCell className="text-primary">
                              {summaryStats.totalRevenue.toFixed(2)} ETB
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-primary">
                              {summaryStats.totalProfit.toFixed(2)} ETB
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {summaryStats.averageRevenue.toFixed(2)} ETB
                            </TableCell>
                          </TableRow>
                        )}
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
  );
}
