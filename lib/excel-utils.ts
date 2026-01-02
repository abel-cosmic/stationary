import * as XLSX from "xlsx";
import type { Product, Category, SellHistory } from "@/types/api";
import type { ExportOptions } from "@/types/common";
import { format } from "date-fns";
import i18n from "@/lib/i18n";

// Helper function to get translation
const t = (key: string, options?: Record<string, unknown>) => {
  return i18n.t(key, options);
};

export function exportToExcel(
  products: Product[],
  options: ExportOptions = {
    products: true,
    sellHistory: true,
    analytics: true,
  }
) {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Prepare Products data
  if (options.products) {
    const productsData = products.map((product) => ({
      [t("common.excel.productId")]: product.id,
      [t("common.excel.productName")]: product.name,
      [t("common.excel.initialPriceETB")]: product.initialPrice,
      [t("common.excel.sellingPriceETB")]: product.sellingPrice,
      [t("common.excel.quantity")]: product.quantity,
      [t("common.excel.totalSold")]: product.totalSold,
      [t("common.excel.revenueETB")]: product.revenue,
      [t("common.excel.profitETB")]: product.profit,
      [t("common.excel.createdAt")]: format(
        new Date(product.createdAt),
        "yyyy-MM-dd HH:mm:ss"
      ),
      [t("common.excel.updatedAt")]: format(
        new Date(product.updatedAt),
        "yyyy-MM-dd HH:mm:ss"
      ),
    }));

    // Create Products worksheet
    const productsSheet = XLSX.utils.json_to_sheet(productsData);
    XLSX.utils.book_append_sheet(
      workbook,
      productsSheet,
      t("common.excel.sheetNames.products")
    );
  }

  // Prepare Sell History data (flattened with product info)
  if (options.sellHistory) {
    const sellHistoryData: any[] = [];
    products.forEach((product) => {
      if (product.sellHistory && product.sellHistory.length > 0) {
        product.sellHistory.forEach((history) => {
          sellHistoryData.push({
            [t("common.excel.productId")]: product.id,
            [t("common.excel.productName")]: product.name,
            [t("common.excel.saleDate")]: format(
              new Date(history.createdAt),
              "yyyy-MM-dd HH:mm:ss"
            ),
            [t("common.excel.quantitySold")]: history.amount,
            [t("common.excel.pricePerUnitETB")]: history.soldPrice,
            [t("common.excel.totalRevenueETB")]: history.totalPrice,
            [t("common.excel.profitETB")]:
              history.totalPrice -
              (history.initialPrice || product.initialPrice) * history.amount,
          });
        });
      }
    });

    // Create Sell History worksheet (always create, even if empty)
    const historySheet = XLSX.utils.json_to_sheet(
      sellHistoryData.length > 0
        ? sellHistoryData
        : [
            {
              [t("common.excel.productId")]: "",
              [t("common.excel.productName")]: t(
                "common.excel.noSellHistoryAvailable"
              ),
              [t("common.excel.saleDate")]: "",
              [t("common.excel.quantitySold")]: "",
              [t("common.excel.pricePerUnitETB")]: "",
              [t("common.excel.totalRevenueETB")]: "",
              [t("common.excel.profitETB")]: "",
            },
          ]
    );
    XLSX.utils.book_append_sheet(
      workbook,
      historySheet,
      t("common.excel.sheetNames.sellHistory")
    );
  }

  // Prepare Analytics data
  if (options.analytics) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    let todayProfit = 0;
    let weeklyProfit = 0;
    let totalProfit = 0;
    const totalProducts = products.length;
    let totalRevenue = 0;
    let totalSold = 0;

    products.forEach((product) => {
      totalProfit += product.profit || 0;
      totalRevenue += product.revenue || 0;
      totalSold += product.totalSold || 0;

      if (product.sellHistory && product.sellHistory.length > 0) {
        product.sellHistory.forEach((history) => {
          const sellDate = new Date(history.createdAt);
          const initialCost =
            (history.initialPrice || product.initialPrice) * history.amount;
          const saleProfit = history.totalPrice - initialCost;

          const sellDateOnly = new Date(
            sellDate.getFullYear(),
            sellDate.getMonth(),
            sellDate.getDate()
          );
          const todayOnly = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );

          if (sellDateOnly.getTime() === todayOnly.getTime()) {
            todayProfit += saleProfit;
          }

          if (sellDate >= weekAgo) {
            weeklyProfit += saleProfit;
          }
        });
      }
    });

    const analyticsData = [
      {
        Metric: t("common.excel.analyticsMetrics.totalProducts"),
        Value: totalProducts,
        Unit: t("common.excel.units.items"),
      },
      {
        Metric: t("common.excel.analyticsMetrics.totalRevenue"),
        Value: totalRevenue.toFixed(2),
        Unit: t("common.excel.units.etb"),
      },
      {
        Metric: t("common.excel.analyticsMetrics.totalItemsSold"),
        Value: totalSold,
        Unit: t("common.excel.units.items"),
      },
      {
        Metric: t("common.excel.analyticsMetrics.todaysProfit"),
        Value: todayProfit.toFixed(2),
        Unit: t("common.excel.units.etb"),
      },
      {
        Metric: t("common.excel.analyticsMetrics.weeklyProfit"),
        Value: weeklyProfit.toFixed(2),
        Unit: t("common.excel.units.etb"),
      },
      {
        Metric: t("common.excel.analyticsMetrics.totalProfit"),
        Value: totalProfit.toFixed(2),
        Unit: t("common.excel.units.etb"),
      },
      {
        Metric: t("common.excel.analyticsMetrics.exportDate"),
        Value: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        Unit: "",
      },
    ];

    const analyticsSheet = XLSX.utils.json_to_sheet(analyticsData);
    XLSX.utils.book_append_sheet(
      workbook,
      analyticsSheet,
      t("common.excel.sheetNames.analytics")
    );
  }

  // Generate Excel file
  const fileName = `${t(
    "common.excel.fileNamePrefix.stationeryInventory"
  )}${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function parseExcelFile(file: File, sheetName?: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        // Use specified sheet name or first sheet
        const targetSheetName = sheetName || workbook.SheetNames[0];

        if (!workbook.SheetNames.includes(targetSheetName)) {
          reject(
            new Error(
              t("common.errors.sheetNotFound", { name: targetSheetName })
            )
          );
          return;
        }

        const worksheet = workbook.Sheets[targetSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        resolve(jsonData);
      } catch (error) {
        reject(
          new Error(
            t("common.errors.failedToParseExcel", {
              error: (error as Error).message,
            })
          )
        );
      }
    };

    reader.onerror = () => {
      reject(new Error(t("common.errors.failedToReadFile")));
    };

    reader.readAsBinaryString(file);
  });
}

export function parseExcelFileMultipleSheets(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        resolve(workbook.SheetNames);
      } catch (error) {
        reject(
          new Error(
            t("common.errors.failedToParseExcel", {
              error: (error as Error).message,
            })
          )
        );
      }
    };

    reader.onerror = () => {
      reject(new Error(t("common.errors.failedToReadFile")));
    };

    reader.readAsBinaryString(file);
  });
}

export function exportCategoriesToExcel(categories: Category[]) {
  const workbook = XLSX.utils.book_new();

  const categoriesData = categories.map((category) => ({
    [t("common.excel.categoryId")]: category.id,
    [t("common.excel.categoryName")]: category.name,
    [t("common.excel.productCount")]: category._count?.products || 0,
    [t("common.excel.createdAt")]: format(
      new Date(category.createdAt),
      "yyyy-MM-dd HH:mm:ss"
    ),
    [t("common.excel.updatedAt")]: format(
      new Date(category.updatedAt),
      "yyyy-MM-dd HH:mm:ss"
    ),
  }));

  const categoriesSheet = XLSX.utils.json_to_sheet(categoriesData);
  XLSX.utils.book_append_sheet(
    workbook,
    categoriesSheet,
    t("common.excel.sheetNames.categories")
  );

  const fileName = `${t("common.excel.fileNamePrefix.categories")}${format(
    new Date(),
    "yyyy-MM-dd_HH-mm-ss"
  )}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportSellHistoryToExcel(
  sellHistory: SellHistory[],
  products: Product[]
) {
  const workbook = XLSX.utils.book_new();

  // Create a map of product ID to product for quick lookup
  const productMap = new Map(products.map((p) => [p.id, p]));

  const sellHistoryData = sellHistory.map((history) => {
    const product = history.productId
      ? productMap.get(history.productId)
      : undefined;
    const initialPrice =
      history.initialPrice || (product ? product.initialPrice : 0);
    const initialCost = initialPrice * history.amount;
    const profit = history.totalPrice - initialCost;

    return {
      [t("common.excel.saleId")]: history.id,
      [t("common.excel.productId")]: history.productId,
      [t("common.excel.productName")]:
        product?.name || t("common.excel.unknown"),
      [t("common.excel.saleDate")]: format(
        new Date(history.createdAt),
        "yyyy-MM-dd HH:mm:ss"
      ),
      [t("common.excel.quantitySold")]: history.amount,
      [t("common.excel.pricePerUnitETB")]: history.soldPrice,
      [t("common.excel.totalRevenueETB")]: history.totalPrice,
      [t("common.excel.profitETB")]: profit,
    };
  });

  const historySheet = XLSX.utils.json_to_sheet(
    sellHistoryData.length > 0
      ? sellHistoryData
      : [
          {
            [t("common.excel.saleId")]: "",
            [t("common.excel.productId")]: "",
            [t("common.excel.productName")]: t(
              "common.excel.noSellHistoryAvailable"
            ),
            [t("common.excel.saleDate")]: "",
            [t("common.excel.quantitySold")]: "",
            [t("common.excel.pricePerUnitETB")]: "",
            [t("common.excel.totalRevenueETB")]: "",
            [t("common.excel.profitETB")]: "",
          },
        ]
  );
  XLSX.utils.book_append_sheet(
    workbook,
    historySheet,
    t("common.excel.sheetNames.sellHistory")
  );

  const fileName = `${t("common.excel.fileNamePrefix.sellHistory")}${format(
    new Date(),
    "yyyy-MM-dd_HH-mm-ss"
  )}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportAnalyticsToExcel(products: Product[]) {
  const workbook = XLSX.utils.book_new();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  let todayProfit = 0;
  let weeklyProfit = 0;
  let monthlyProfit = 0;
  let totalProfit = 0;
  const totalProducts = products.length;
  let totalRevenue = 0;
  let totalSold = 0;
  let totalInitialCost = 0;

  // Category breakdown
  const categoryStats = new Map<
    string,
    { revenue: number; profit: number; sold: number; products: number }
  >();

  products.forEach((product) => {
    totalProfit += product.profit || 0;
    totalRevenue += product.revenue || 0;
    totalSold += product.totalSold || 0;
    totalInitialCost += product.initialPrice * (product.totalSold || 0);

    const categoryName =
      product.category?.name || t("common.sellHistory.uncategorized");
    if (!categoryStats.has(categoryName)) {
      categoryStats.set(categoryName, {
        revenue: 0,
        profit: 0,
        sold: 0,
        products: 0,
      });
    }
    const stats = categoryStats.get(categoryName)!;
    stats.revenue += product.revenue || 0;
    stats.profit += product.profit || 0;
    stats.sold += product.totalSold || 0;
    stats.products += 1;

    if (product.sellHistory && product.sellHistory.length > 0) {
      product.sellHistory.forEach((history) => {
        const sellDate = new Date(history.createdAt);
        const initialPrice = history.initialPrice || product.initialPrice;
        const initialCost = initialPrice * history.amount;
        const saleProfit = history.totalPrice - initialCost;

        const sellDateOnly = new Date(
          sellDate.getFullYear(),
          sellDate.getMonth(),
          sellDate.getDate()
        );
        const todayOnly = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );

        if (sellDateOnly.getTime() === todayOnly.getTime()) {
          todayProfit += saleProfit;
        }

        if (sellDate >= weekAgo) {
          weeklyProfit += saleProfit;
        }

        if (sellDate >= monthAgo) {
          monthlyProfit += saleProfit;
        }
      });
    }
  });

  const analyticsData = [
    {
      Metric: t("common.excel.analyticsMetrics.totalProducts"),
      Value: totalProducts,
      Unit: t("common.excel.units.items"),
    },
    {
      Metric: t("common.excel.analyticsMetrics.totalRevenue"),
      Value: totalRevenue.toFixed(2),
      Unit: t("common.excel.units.etb"),
    },
    {
      Metric: t("common.excel.analyticsMetrics.totalItemsSold"),
      Value: totalSold,
      Unit: t("common.excel.units.items"),
    },
    {
      Metric: t("common.excel.analyticsMetrics.totalInitialCost"),
      Value: totalInitialCost.toFixed(2),
      Unit: t("common.excel.units.etb"),
    },
    {
      Metric: t("common.excel.analyticsMetrics.todaysProfit"),
      Value: todayProfit.toFixed(2),
      Unit: t("common.excel.units.etb"),
    },
    {
      Metric: t("common.excel.analyticsMetrics.weeklyProfit"),
      Value: weeklyProfit.toFixed(2),
      Unit: t("common.excel.units.etb"),
    },
    {
      Metric: t("common.excel.analyticsMetrics.monthlyProfit"),
      Value: monthlyProfit.toFixed(2),
      Unit: t("common.excel.units.etb"),
    },
    {
      Metric: t("common.excel.analyticsMetrics.totalProfit"),
      Value: totalProfit.toFixed(2),
      Unit: t("common.excel.units.etb"),
    },
    {
      Metric: t("common.excel.analyticsMetrics.profitMargin"),
      Value:
        totalRevenue > 0
          ? ((totalProfit / totalRevenue) * 100).toFixed(2)
          : "0.00",
      Unit: t("common.excel.units.percent"),
    },
    {
      Metric: t("common.excel.analyticsMetrics.exportDate"),
      Value: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      Unit: "",
    },
  ];

  const analyticsSheet = XLSX.utils.json_to_sheet(analyticsData);
  XLSX.utils.book_append_sheet(
    workbook,
    analyticsSheet,
    t("common.excel.sheetNames.analyticsSummary")
  );

  // Add category breakdown if there are categories
  if (categoryStats.size > 0) {
    const categoryData = Array.from(categoryStats.entries()).map(
      ([category, stats]) => ({
        [t("common.excel.category")]: category,
        [t("common.excel.analyticsMetrics.totalProducts")]: stats.products,
        [t("common.excel.analyticsMetrics.itemsSold")]: stats.sold,
        [t("common.excel.revenueETB")]: stats.revenue.toFixed(2),
        [t("common.excel.profitETB")]: stats.profit.toFixed(2),
        [t("common.excel.analyticsMetrics.profitMarginPercent")]:
          stats.revenue > 0
            ? ((stats.profit / stats.revenue) * 100).toFixed(2)
            : "0.00",
      })
    );

    const categorySheet = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(
      workbook,
      categorySheet,
      t("common.excel.sheetNames.categoryBreakdown")
    );
  }

  const fileName = `${t("common.excel.fileNamePrefix.analytics")}${format(
    new Date(),
    "yyyy-MM-dd_HH-mm-ss"
  )}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportDailySellsToExcel(
  sellHistory: (SellHistory & { product?: Product })[],
  products: Product[]
) {
  const workbook = XLSX.utils.book_new();

  // Get today's date (start of day)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Filter sell history to only today's sales
  const todaySales = sellHistory.filter((history) => {
    const saleDate = new Date(history.createdAt);
    const saleDateOnly = new Date(
      saleDate.getFullYear(),
      saleDate.getMonth(),
      saleDate.getDate()
    );
    return saleDateOnly.getTime() === today.getTime();
  });

  // Create a map of product ID to product for quick lookup
  const productMap = new Map(products.map((p) => [p.id, p]));

  const dailySalesData = todaySales.map((history) => {
    const product =
      history.product ||
      (history.productId ? productMap.get(history.productId) : undefined);
    const initialPrice =
      history.initialPrice || (product ? product.initialPrice : 0);
    const initialCost = initialPrice * history.amount;
    const profit = history.totalPrice - initialCost;

    const paymentStatus = history.debitItem
      ? history.debitItem.debit?.status === "PAID"
        ? t("common.debits.paid") || "Paid"
        : history.debitItem.debit?.status === "PARTIAL"
        ? t("common.debits.partial") || "Partial"
        : t("common.debits.pending") || "Pending"
      : t("common.debits.paid") || "Paid";

    return {
      [t("common.excel.saleId")]: history.id,
      [t("common.excel.productId")]: history.productId,
      [t("common.excel.productName")]:
        product?.name || t("common.excel.unknown"),
      [t("common.excel.category")]:
        product?.category?.name || t("common.sellHistory.uncategorized"),
      [t("common.excel.saleTime")]: format(
        new Date(history.createdAt),
        "HH:mm:ss"
      ),
      [t("common.excel.quantitySold")]: history.amount,
      [t("common.excel.pricePerUnitETB")]: history.soldPrice,
      [t("common.excel.totalRevenueETB")]: history.totalPrice,
      [t("common.excel.profitETB")]: profit,
      [t("common.excel.paymentStatus") || "Payment Status"]: paymentStatus,
    };
  });

  // Calculate daily summary
  const totalRevenue = todaySales.reduce(
    (sum, sale) => sum + sale.totalPrice,
    0
  );
  const totalQuantity = todaySales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalProfit = dailySalesData.reduce(
    (sum, item) => sum + (item[t("common.excel.profitETB")] as number),
    0
  );

  // Create Daily Sales worksheet
  const dailySalesSheet = XLSX.utils.json_to_sheet(
    dailySalesData.length > 0
      ? dailySalesData
      : [
          {
            [t("common.excel.saleId")]: "",
            [t("common.excel.productId")]: "",
            [t("common.excel.productName")]: t("common.excel.noSalesToday"),
            [t("common.excel.category")]: "",
            [t("common.excel.saleTime")]: "",
            [t("common.excel.quantitySold")]: "",
            [t("common.excel.pricePerUnitETB")]: "",
            [t("common.excel.totalRevenueETB")]: "",
            [t("common.excel.profitETB")]: "",
          },
        ]
  );
  XLSX.utils.book_append_sheet(
    workbook,
    dailySalesSheet,
    t("common.excel.sheetNames.dailySales")
  );

  // Create Summary worksheet
  const summaryData = [
    {
      Metric: t("common.excel.analyticsMetrics.date"),
      Value: format(today, "yyyy-MM-dd"),
      Unit: "",
    },
    {
      Metric: t("common.excel.analyticsMetrics.totalSales"),
      Value: todaySales.length,
      Unit: t("common.excel.units.transactions"),
    },
    {
      Metric: t("common.excel.analyticsMetrics.totalQuantitySold"),
      Value: totalQuantity,
      Unit: t("common.excel.units.items"),
    },
    {
      Metric: t("common.excel.analyticsMetrics.totalRevenue"),
      Value: totalRevenue.toFixed(2),
      Unit: t("common.excel.units.etb"),
    },
    {
      Metric: t("common.excel.analyticsMetrics.totalProfit"),
      Value: totalProfit.toFixed(2),
      Unit: t("common.excel.units.etb"),
    },
    {
      Metric: t("common.excel.analyticsMetrics.averageRevenuePerSale"),
      Value:
        todaySales.length > 0
          ? (totalRevenue / todaySales.length).toFixed(2)
          : "0.00",
      Unit: t("common.excel.units.etb"),
    },
    {
      Metric: t("common.excel.analyticsMetrics.exportTime"),
      Value: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      Unit: "",
    },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    t("common.excel.sheetNames.dailySummary")
  );

  const fileName = `${t("common.excel.fileNamePrefix.dailySales")}${format(
    today,
    "yyyy-MM-dd"
  )}_${format(new Date(), "HH-mm-ss")}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function generateSalesReport(products: Product[]) {
  const workbook = XLSX.utils.book_new();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  // Extract all sell history
  const allSellHistory: (SellHistory & { product: Product })[] = [];
  products.forEach((product) => {
    if (product.sellHistory && product.sellHistory.length > 0) {
      product.sellHistory.forEach((history) => {
        allSellHistory.push({
          ...history,
          product,
        });
      });
    }
  });

  // Calculate daily stats
  let todayRevenue = 0;
  let todayQuantity = 0;
  let todayProfit = 0;
  const todaySales: (SellHistory & { product: Product })[] = [];

  // Calculate weekly stats
  let weeklyRevenue = 0;
  let weeklyQuantity = 0;
  let weeklyProfit = 0;

  // Calculate monthly stats
  let monthlyRevenue = 0;
  let monthlyQuantity = 0;
  let monthlyProfit = 0;

  // Calculate totals
  let totalRevenue = 0;
  let totalQuantity = 0;
  let totalProfit = 0;

  // Product sales tracking
  const productSalesMap = new Map<
    number,
    {
      product: Product;
      quantity: number;
      revenue: number;
      profit: number;
    }
  >();

  // Category sales tracking
  const categorySalesMap = new Map<
    string,
    {
      quantity: number;
      revenue: number;
      profit: number;
      transactions: number;
    }
  >();

  allSellHistory.forEach((history) => {
    const saleDate = new Date(history.createdAt);
    const saleDateOnly = new Date(
      saleDate.getFullYear(),
      saleDate.getMonth(),
      saleDate.getDate()
    );
    const initialPrice = history.initialPrice || history.product.initialPrice;
    const initialCost = initialPrice * history.amount;
    const profit = history.totalPrice - initialCost;

    // Daily stats
    if (saleDateOnly.getTime() === today.getTime()) {
      todayRevenue += history.totalPrice;
      todayQuantity += history.amount;
      todayProfit += profit;
      todaySales.push(history);
    }

    // Weekly stats
    if (saleDate >= weekAgo) {
      weeklyRevenue += history.totalPrice;
      weeklyQuantity += history.amount;
      weeklyProfit += profit;
    }

    // Monthly stats
    if (saleDate >= monthAgo) {
      monthlyRevenue += history.totalPrice;
      monthlyQuantity += history.amount;
      monthlyProfit += profit;
    }

    // Total stats
    totalRevenue += history.totalPrice;
    totalQuantity += history.amount;
    totalProfit += profit;

    // Product tracking (only for products, not services)
    if (history.productId) {
      if (!productSalesMap.has(history.productId)) {
        productSalesMap.set(history.productId, {
          product: history.product,
          quantity: 0,
          revenue: 0,
          profit: 0,
        });
      }
      const productStats = productSalesMap.get(history.productId)!;
      productStats.quantity += history.amount;
      productStats.revenue += history.totalPrice;
      productStats.profit += profit;
    }

    // Category tracking
    const categoryName =
      history.product.category?.name || t("common.sellHistory.uncategorized");
    if (!categorySalesMap.has(categoryName)) {
      categorySalesMap.set(categoryName, {
        quantity: 0,
        revenue: 0,
        profit: 0,
        transactions: 0,
      });
    }
    const categoryStats = categorySalesMap.get(categoryName)!;
    categoryStats.quantity += history.amount;
    categoryStats.revenue += history.totalPrice;
    categoryStats.profit += profit;
    categoryStats.transactions += 1;
  });

  // 1. Summary Sheet
  const summaryData = [
    {
      [t("common.excel.analyticsMetrics.period")]: t(
        "common.excel.periods.today"
      ),
      [t("common.excel.analyticsMetrics.revenueETB")]: todayRevenue.toFixed(2),
      [t("common.excel.analyticsMetrics.itemsSold")]: todayQuantity,
      [t("common.excel.profitETB")]: todayProfit.toFixed(2),
      [t("common.excel.analyticsMetrics.transactions")]: todaySales.length,
    },
    {
      [t("common.excel.analyticsMetrics.period")]: t(
        "common.excel.periods.last7Days"
      ),
      [t("common.excel.analyticsMetrics.revenueETB")]: weeklyRevenue.toFixed(2),
      [t("common.excel.analyticsMetrics.itemsSold")]: weeklyQuantity,
      [t("common.excel.profitETB")]: weeklyProfit.toFixed(2),
      [t("common.excel.analyticsMetrics.transactions")]: allSellHistory.filter(
        (h) => new Date(h.createdAt) >= weekAgo
      ).length,
    },
    {
      [t("common.excel.analyticsMetrics.period")]: t(
        "common.excel.periods.last30Days"
      ),
      [t("common.excel.analyticsMetrics.revenueETB")]:
        monthlyRevenue.toFixed(2),
      [t("common.excel.analyticsMetrics.itemsSold")]: monthlyQuantity,
      [t("common.excel.profitETB")]: monthlyProfit.toFixed(2),
      [t("common.excel.analyticsMetrics.transactions")]: allSellHistory.filter(
        (h) => new Date(h.createdAt) >= monthAgo
      ).length,
    },
    {
      [t("common.excel.analyticsMetrics.period")]: t(
        "common.excel.periods.allTime"
      ),
      [t("common.excel.analyticsMetrics.revenueETB")]: totalRevenue.toFixed(2),
      [t("common.excel.analyticsMetrics.itemsSold")]: totalQuantity,
      [t("common.excel.profitETB")]: totalProfit.toFixed(2),
      [t("common.excel.analyticsMetrics.transactions")]: allSellHistory.length,
    },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    t("common.excel.sheetNames.summary")
  );

  // 2. Top Products Sheet
  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20)
    .map((stats) => ({
      [t("common.excel.productName")]: stats.product.name,
      [t("common.excel.category")]:
        stats.product.category?.name || t("common.sellHistory.uncategorized"),
      [t("common.excel.quantitySold")]: stats.quantity,
      [t("common.excel.revenueETB")]: stats.revenue.toFixed(2),
      [t("common.excel.profitETB")]: stats.profit.toFixed(2),
      [t("common.excel.analyticsMetrics.profitMarginPercent")]:
        stats.revenue > 0
          ? ((stats.profit / stats.revenue) * 100).toFixed(2)
          : "0.00",
    }));

  const topProductsSheet = XLSX.utils.json_to_sheet(
    topProducts.length > 0
      ? topProducts
      : [
          {
            [t("common.excel.productName")]: t(
              "common.excel.noSalesDataAvailable"
            ),
            [t("common.excel.category")]: "",
            [t("common.excel.quantitySold")]: "",
            [t("common.excel.revenueETB")]: "",
            [t("common.excel.profitETB")]: "",
            [t("common.excel.analyticsMetrics.profitMarginPercent")]: "",
          },
        ]
  );
  XLSX.utils.book_append_sheet(
    workbook,
    topProductsSheet,
    t("common.excel.sheetNames.topProducts")
  );

  // 3. Category Breakdown Sheet
  const categoryData = Array.from(categorySalesMap.entries())
    .map(([category, stats]) => ({
      [t("common.excel.category")]: category,
      [t("common.excel.analyticsMetrics.transactions")]: stats.transactions,
      [t("common.excel.analyticsMetrics.itemsSold")]: stats.quantity,
      [t("common.excel.revenueETB")]: stats.revenue.toFixed(2),
      [t("common.excel.profitETB")]: stats.profit.toFixed(2),
      [t("common.excel.analyticsMetrics.profitMarginPercent")]:
        stats.revenue > 0
          ? ((stats.profit / stats.revenue) * 100).toFixed(2)
          : "0.00",
      [t("common.excel.analyticsMetrics.averageRevenuePerTransaction")]:
        stats.transactions > 0
          ? (stats.revenue / stats.transactions).toFixed(2)
          : "0.00",
    }))
    .sort(
      (a, b) =>
        parseFloat(String(b[t("common.excel.revenueETB")])) -
        parseFloat(String(a[t("common.excel.revenueETB")]))
    );

  const categorySheet = XLSX.utils.json_to_sheet(
    categoryData.length > 0
      ? categoryData
      : [
          {
            [t("common.excel.category")]: t(
              "common.excel.noSalesDataAvailable"
            ),
            [t("common.excel.analyticsMetrics.transactions")]: "",
            [t("common.excel.analyticsMetrics.itemsSold")]: "",
            [t("common.excel.revenueETB")]: "",
            [t("common.excel.profitETB")]: "",
            [t("common.excel.analyticsMetrics.profitMarginPercent")]: "",
            [t("common.excel.analyticsMetrics.averageRevenuePerTransaction")]:
              "",
          },
        ]
  );
  XLSX.utils.book_append_sheet(
    workbook,
    categorySheet,
    t("common.excel.sheetNames.categoryBreakdown")
  );

  // 4. Daily Sales Sheet (last 30 days)
  const dailySalesMap = new Map<
    string,
    { revenue: number; quantity: number; profit: number; transactions: number }
  >();

  allSellHistory
    .filter((h) => new Date(h.createdAt) >= monthAgo)
    .forEach((history) => {
      const dateKey = format(new Date(history.createdAt), "yyyy-MM-dd");
      if (!dailySalesMap.has(dateKey)) {
        dailySalesMap.set(dateKey, {
          revenue: 0,
          quantity: 0,
          profit: 0,
          transactions: 0,
        });
      }
      const dayStats = dailySalesMap.get(dateKey)!;
      const initialPrice = history.initialPrice || history.product.initialPrice;
      const initialCost = initialPrice * history.amount;
      dayStats.revenue += history.totalPrice;
      dayStats.quantity += history.amount;
      dayStats.profit += history.totalPrice - initialCost;
      dayStats.transactions += 1;
    });

  const dailySalesData = Array.from(dailySalesMap.entries())
    .map(([date, stats]) => ({
      [t("common.excel.analyticsMetrics.date")]: date,
      [t("common.excel.analyticsMetrics.revenueETB")]: stats.revenue.toFixed(2),
      [t("common.excel.analyticsMetrics.itemsSold")]: stats.quantity,
      [t("common.excel.profitETB")]: stats.profit.toFixed(2),
      [t("common.excel.analyticsMetrics.transactions")]: stats.transactions,
    }))
    .sort((a, b) =>
      String(b[t("common.excel.analyticsMetrics.date")]).localeCompare(
        String(a[t("common.excel.analyticsMetrics.date")])
      )
    );

  const dailySalesSheet = XLSX.utils.json_to_sheet(
    dailySalesData.length > 0
      ? dailySalesData
      : [
          {
            [t("common.excel.analyticsMetrics.date")]: t(
              "common.excel.noSalesDataAvailable"
            ),
            [t("common.excel.analyticsMetrics.revenueETB")]: "",
            [t("common.excel.analyticsMetrics.itemsSold")]: "",
            [t("common.excel.profitETB")]: "",
            [t("common.excel.analyticsMetrics.transactions")]: "",
          },
        ]
  );
  XLSX.utils.book_append_sheet(
    workbook,
    dailySalesSheet,
    t("common.excel.sheetNames.dailySales")
  );

  const fileName = `${t("common.excel.fileNamePrefix.salesReport")}${format(
    new Date(),
    "yyyy-MM-dd_HH-mm-ss"
  )}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
