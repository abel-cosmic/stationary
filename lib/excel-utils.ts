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
