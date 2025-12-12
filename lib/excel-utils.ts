// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - xlsx types may not be available
import * as XLSX from "xlsx";
import { Product, Category, SellHistory } from "./api";
import { format } from "date-fns";

interface ExportOptions {
  products?: boolean;
  sellHistory?: boolean;
  analytics?: boolean;
}

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
      "Product ID": product.id,
      "Product Name": product.name,
      "Initial Price (ETB)": product.initialPrice,
      "Selling Price (ETB)": product.sellingPrice,
      Quantity: product.quantity,
      "Total Sold": product.totalSold,
      "Revenue (ETB)": product.revenue,
      "Profit (ETB)": product.profit,
      "Created At": format(new Date(product.createdAt), "yyyy-MM-dd HH:mm:ss"),
      "Updated At": format(new Date(product.updatedAt), "yyyy-MM-dd HH:mm:ss"),
    }));

    // Create Products worksheet
    const productsSheet = XLSX.utils.json_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, "Products");
  }

  // Prepare Sell History data (flattened with product info)
  if (options.sellHistory) {
    const sellHistoryData: any[] = [];
    products.forEach((product) => {
      if (product.sellHistory && product.sellHistory.length > 0) {
        product.sellHistory.forEach((history) => {
          sellHistoryData.push({
            "Product ID": product.id,
            "Product Name": product.name,
            "Sale Date": format(
              new Date(history.createdAt),
              "yyyy-MM-dd HH:mm:ss"
            ),
            "Quantity Sold": history.amount,
            "Price per Unit (ETB)": history.soldPrice,
            "Total Revenue (ETB)": history.totalPrice,
            "Profit (ETB)":
              history.totalPrice - product.initialPrice * history.amount,
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
              "Product ID": "",
              "Product Name": "No sell history available",
              "Sale Date": "",
              "Quantity Sold": "",
              "Price per Unit (ETB)": "",
              "Total Revenue (ETB)": "",
              "Profit (ETB)": "",
            },
          ]
    );
    XLSX.utils.book_append_sheet(workbook, historySheet, "Sell History");
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
          const initialCost = product.initialPrice * history.amount;
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
        Metric: "Total Products",
        Value: totalProducts,
        Unit: "items",
      },
      {
        Metric: "Total Revenue",
        Value: totalRevenue.toFixed(2),
        Unit: "ETB",
      },
      {
        Metric: "Total Items Sold",
        Value: totalSold,
        Unit: "items",
      },
      {
        Metric: "Today's Profit",
        Value: todayProfit.toFixed(2),
        Unit: "ETB",
      },
      {
        Metric: "Weekly Profit (Last 7 Days)",
        Value: weeklyProfit.toFixed(2),
        Unit: "ETB",
      },
      {
        Metric: "Total Profit",
        Value: totalProfit.toFixed(2),
        Unit: "ETB",
      },
      {
        Metric: "Export Date",
        Value: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        Unit: "",
      },
    ];

    const analyticsSheet = XLSX.utils.json_to_sheet(analyticsData);
    XLSX.utils.book_append_sheet(workbook, analyticsSheet, "Analytics");
  }

  // Generate Excel file
  const fileName = `Stationery_Inventory_${format(
    new Date(),
    "yyyy-MM-dd_HH-mm-ss"
  )}.xlsx`;
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
          reject(new Error(`Sheet "${targetSheetName}" not found in the file`));
          return;
        }

        const worksheet = workbook.Sheets[targetSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        resolve(jsonData);
      } catch (error) {
        reject(
          new Error("Failed to parse Excel file: " + (error as Error).message)
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
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
          new Error("Failed to parse Excel file: " + (error as Error).message)
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsBinaryString(file);
  });
}

export function exportCategoriesToExcel(categories: Category[]) {
  const workbook = XLSX.utils.book_new();

  const categoriesData = categories.map((category) => ({
    "Category ID": category.id,
    "Category Name": category.name,
    "Product Count": category._count?.products || 0,
    "Created At": format(new Date(category.createdAt), "yyyy-MM-dd HH:mm:ss"),
    "Updated At": format(new Date(category.updatedAt), "yyyy-MM-dd HH:mm:ss"),
  }));

  const categoriesSheet = XLSX.utils.json_to_sheet(categoriesData);
  XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Categories");

  const fileName = `Categories_${format(
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
    const product = productMap.get(history.productId);
    const initialCost = product ? product.initialPrice * history.amount : 0;
    const profit = history.totalPrice - initialCost;

    return {
      "Sale ID": history.id,
      "Product ID": history.productId,
      "Product Name": product?.name || "Unknown",
      "Sale Date": format(new Date(history.createdAt), "yyyy-MM-dd HH:mm:ss"),
      "Quantity Sold": history.amount,
      "Price per Unit (ETB)": history.soldPrice,
      "Total Revenue (ETB)": history.totalPrice,
      "Profit (ETB)": profit,
    };
  });

  const historySheet = XLSX.utils.json_to_sheet(
    sellHistoryData.length > 0
      ? sellHistoryData
      : [
          {
            "Sale ID": "",
            "Product ID": "",
            "Product Name": "No sell history available",
            "Sale Date": "",
            "Quantity Sold": "",
            "Price per Unit (ETB)": "",
            "Total Revenue (ETB)": "",
            "Profit (ETB)": "",
          },
        ]
  );
  XLSX.utils.book_append_sheet(workbook, historySheet, "Sell History");

  const fileName = `SellHistory_${format(
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

    const categoryName = product.category?.name || "Uncategorized";
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
        const initialCost = product.initialPrice * history.amount;
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
      Metric: "Total Products",
      Value: totalProducts,
      Unit: "items",
    },
    {
      Metric: "Total Revenue",
      Value: totalRevenue.toFixed(2),
      Unit: "ETB",
    },
    {
      Metric: "Total Items Sold",
      Value: totalSold,
      Unit: "items",
    },
    {
      Metric: "Total Initial Cost",
      Value: totalInitialCost.toFixed(2),
      Unit: "ETB",
    },
    {
      Metric: "Today's Profit",
      Value: todayProfit.toFixed(2),
      Unit: "ETB",
    },
    {
      Metric: "Weekly Profit (Last 7 Days)",
      Value: weeklyProfit.toFixed(2),
      Unit: "ETB",
    },
    {
      Metric: "Monthly Profit (Last 30 Days)",
      Value: monthlyProfit.toFixed(2),
      Unit: "ETB",
    },
    {
      Metric: "Total Profit",
      Value: totalProfit.toFixed(2),
      Unit: "ETB",
    },
    {
      Metric: "Profit Margin",
      Value:
        totalRevenue > 0
          ? ((totalProfit / totalRevenue) * 100).toFixed(2)
          : "0.00",
      Unit: "%",
    },
    {
      Metric: "Export Date",
      Value: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      Unit: "",
    },
  ];

  const analyticsSheet = XLSX.utils.json_to_sheet(analyticsData);
  XLSX.utils.book_append_sheet(workbook, analyticsSheet, "Analytics Summary");

  // Add category breakdown if there are categories
  if (categoryStats.size > 0) {
    const categoryData = Array.from(categoryStats.entries()).map(
      ([category, stats]) => ({
        Category: category,
        Products: stats.products,
        "Items Sold": stats.sold,
        "Revenue (ETB)": stats.revenue.toFixed(2),
        "Profit (ETB)": stats.profit.toFixed(2),
        "Profit Margin (%)":
          stats.revenue > 0
            ? ((stats.profit / stats.revenue) * 100).toFixed(2)
            : "0.00",
      })
    );

    const categorySheet = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(workbook, categorySheet, "Category Breakdown");
  }

  const fileName = `Analytics_${format(
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
    const product = history.product || productMap.get(history.productId);
    const initialCost = product ? product.initialPrice * history.amount : 0;
    const profit = history.totalPrice - initialCost;

    return {
      "Sale ID": history.id,
      "Product ID": history.productId,
      "Product Name": product?.name || "Unknown",
      Category: product?.category?.name || "Uncategorized",
      "Sale Time": format(new Date(history.createdAt), "HH:mm:ss"),
      "Quantity Sold": history.amount,
      "Price per Unit (ETB)": history.soldPrice,
      "Total Revenue (ETB)": history.totalPrice,
      "Profit (ETB)": profit,
    };
  });

  // Calculate daily summary
  const totalRevenue = todaySales.reduce(
    (sum, sale) => sum + sale.totalPrice,
    0
  );
  const totalQuantity = todaySales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalProfit = dailySalesData.reduce(
    (sum, item) => sum + (item["Profit (ETB)"] as number),
    0
  );

  // Create Daily Sales worksheet
  const dailySalesSheet = XLSX.utils.json_to_sheet(
    dailySalesData.length > 0
      ? dailySalesData
      : [
          {
            "Sale ID": "",
            "Product ID": "",
            "Product Name": "No sales today",
            Category: "",
            "Sale Time": "",
            "Quantity Sold": "",
            "Price per Unit (ETB)": "",
            "Total Revenue (ETB)": "",
            "Profit (ETB)": "",
          },
        ]
  );
  XLSX.utils.book_append_sheet(workbook, dailySalesSheet, "Daily Sales");

  // Create Summary worksheet
  const summaryData = [
    {
      Metric: "Date",
      Value: format(today, "yyyy-MM-dd"),
      Unit: "",
    },
    {
      Metric: "Total Sales",
      Value: todaySales.length,
      Unit: "transactions",
    },
    {
      Metric: "Total Quantity Sold",
      Value: totalQuantity,
      Unit: "items",
    },
    {
      Metric: "Total Revenue",
      Value: totalRevenue.toFixed(2),
      Unit: "ETB",
    },
    {
      Metric: "Total Profit",
      Value: totalProfit.toFixed(2),
      Unit: "ETB",
    },
    {
      Metric: "Average Revenue per Sale",
      Value:
        todaySales.length > 0
          ? (totalRevenue / todaySales.length).toFixed(2)
          : "0.00",
      Unit: "ETB",
    },
    {
      Metric: "Export Time",
      Value: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      Unit: "",
    },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Daily Summary");

  const fileName = `DailySales_${format(today, "yyyy-MM-dd")}_${format(
    new Date(),
    "HH-mm-ss"
  )}.xlsx`;
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
    const initialCost = history.product.initialPrice * history.amount;
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

    // Product tracking
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

    // Category tracking
    const categoryName = history.product.category?.name || "Uncategorized";
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
      Period: "Today",
      "Total Revenue (ETB)": todayRevenue.toFixed(2),
      "Items Sold": todayQuantity,
      "Profit (ETB)": todayProfit.toFixed(2),
      Transactions: todaySales.length,
    },
    {
      Period: "Last 7 Days",
      "Total Revenue (ETB)": weeklyRevenue.toFixed(2),
      "Items Sold": weeklyQuantity,
      "Profit (ETB)": weeklyProfit.toFixed(2),
      Transactions: allSellHistory.filter(
        (h) => new Date(h.createdAt) >= weekAgo
      ).length,
    },
    {
      Period: "Last 30 Days",
      "Total Revenue (ETB)": monthlyRevenue.toFixed(2),
      "Items Sold": monthlyQuantity,
      "Profit (ETB)": monthlyProfit.toFixed(2),
      Transactions: allSellHistory.filter(
        (h) => new Date(h.createdAt) >= monthAgo
      ).length,
    },
    {
      Period: "All Time",
      "Total Revenue (ETB)": totalRevenue.toFixed(2),
      "Items Sold": totalQuantity,
      "Profit (ETB)": totalProfit.toFixed(2),
      Transactions: allSellHistory.length,
    },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // 2. Top Products Sheet
  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20)
    .map((stats) => ({
      "Product Name": stats.product.name,
      Category: stats.product.category?.name || "Uncategorized",
      "Quantity Sold": stats.quantity,
      "Revenue (ETB)": stats.revenue.toFixed(2),
      "Profit (ETB)": stats.profit.toFixed(2),
      "Profit Margin (%)":
        stats.revenue > 0
          ? ((stats.profit / stats.revenue) * 100).toFixed(2)
          : "0.00",
    }));

  const topProductsSheet = XLSX.utils.json_to_sheet(
    topProducts.length > 0
      ? topProducts
      : [
          {
            "Product Name": "No sales data available",
            Category: "",
            "Quantity Sold": "",
            "Revenue (ETB)": "",
            "Profit (ETB)": "",
            "Profit Margin (%)": "",
          },
        ]
  );
  XLSX.utils.book_append_sheet(workbook, topProductsSheet, "Top Products");

  // 3. Category Breakdown Sheet
  const categoryData = Array.from(categorySalesMap.entries())
    .map(([category, stats]) => ({
      Category: category,
      Transactions: stats.transactions,
      "Items Sold": stats.quantity,
      "Revenue (ETB)": stats.revenue.toFixed(2),
      "Profit (ETB)": stats.profit.toFixed(2),
      "Profit Margin (%)":
        stats.revenue > 0
          ? ((stats.profit / stats.revenue) * 100).toFixed(2)
          : "0.00",
      "Average Revenue per Transaction":
        stats.transactions > 0
          ? (stats.revenue / stats.transactions).toFixed(2)
          : "0.00",
    }))
    .sort(
      (a, b) => parseFloat(b["Revenue (ETB)"]) - parseFloat(a["Revenue (ETB)"])
    );

  const categorySheet = XLSX.utils.json_to_sheet(
    categoryData.length > 0
      ? categoryData
      : [
          {
            Category: "No sales data available",
            Transactions: "",
            "Items Sold": "",
            "Revenue (ETB)": "",
            "Profit (ETB)": "",
            "Profit Margin (%)": "",
            "Average Revenue per Transaction": "",
          },
        ]
  );
  XLSX.utils.book_append_sheet(workbook, categorySheet, "Category Breakdown");

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
      const initialCost = history.product.initialPrice * history.amount;
      dayStats.revenue += history.totalPrice;
      dayStats.quantity += history.amount;
      dayStats.profit += history.totalPrice - initialCost;
      dayStats.transactions += 1;
    });

  const dailySalesData = Array.from(dailySalesMap.entries())
    .map(([date, stats]) => ({
      Date: date,
      "Revenue (ETB)": stats.revenue.toFixed(2),
      "Items Sold": stats.quantity,
      "Profit (ETB)": stats.profit.toFixed(2),
      Transactions: stats.transactions,
    }))
    .sort((a, b) => b.Date.localeCompare(a.Date));

  const dailySalesSheet = XLSX.utils.json_to_sheet(
    dailySalesData.length > 0
      ? dailySalesData
      : [
          {
            Date: "No sales data available",
            "Revenue (ETB)": "",
            "Items Sold": "",
            "Profit (ETB)": "",
            Transactions: "",
          },
        ]
  );
  XLSX.utils.book_append_sheet(workbook, dailySalesSheet, "Daily Sales");

  const fileName = `SalesReport_${format(
    new Date(),
    "yyyy-MM-dd_HH-mm-ss"
  )}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
