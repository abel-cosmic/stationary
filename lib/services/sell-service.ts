import type { SellHistory, Product, Service } from "@/types/api";
import type { SalesTab } from "@/types/quick-sell";

export interface SummaryStats {
  totalRevenue: number;
  totalQuantity: number;
  totalProfit: number;
  totalTransactions: number;
  averageRevenue: number;
}

/**
 * Get all sell history from products and services, grouped by transaction
 */
export function getAllSellHistory(
  products?: Product[],
  services?: Service[]
): (SellHistory & { product?: Product; service?: Service })[] {
  const history: (SellHistory & { product?: Product; service?: Service })[] =
    [];

  // Add product sell history
  if (products) {
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
  }

  // Add service sell history
  if (services) {
    services.forEach((service) => {
      if (service.sellHistory && service.sellHistory.length > 0) {
        service.sellHistory.forEach((item) => {
          history.push({
            ...item,
            service,
          });
        });
      }
    });
  }

  // Sort by date, most recent first
  return history.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Filter sell history based on active tab
 */
export function filterSellHistoryByTab(
  allSellHistory: (SellHistory & { product?: Product; service?: Service })[],
  activeTab: SalesTab
): (SellHistory & { product?: Product; service?: Service })[] {
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
}

/**
 * Calculate summary statistics for filtered sell history
 */
export function calculateSummaryStats(
  filteredSellHistory: (SellHistory & {
    product?: Product;
    service?: Service;
  })[],
  activeTab: SalesTab
): SummaryStats | null {
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
    // For services, profit = revenue (no cost)
    if (item.serviceId && item.service) {
      return sum + item.totalPrice;
    }
    // For products, calculate profit from initial price
    if (item.productId && item.product) {
      const initialPrice = item.initialPrice || item.product.initialPrice;
      const initialCost = initialPrice * item.amount;
      return sum + (item.totalPrice - initialCost);
    }
    return sum;
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
}

/**
 * Group sell history by date for summary views
 */
export function groupSellHistoryByDate(
  history: (SellHistory & { product?: Product; service?: Service })[]
): Map<
  string,
  {
    date: string;
    transactions: number;
    quantity: number;
    revenue: number;
    profit: number;
  }
> {
  const grouped = new Map<
    string,
    {
      date: string;
      transactions: number;
      quantity: number;
      revenue: number;
      profit: number;
    }
  >();

  history.forEach((item) => {
    const dateKey = new Date(item.createdAt).toISOString().split("T")[0];
    const displayDate = new Date(item.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, {
        date: displayDate,
        transactions: 0,
        quantity: 0,
        revenue: 0,
        profit: 0,
      });
    }

    const dayStats = grouped.get(dateKey)!;
    dayStats.transactions += 1;
    dayStats.quantity += item.amount;
    dayStats.revenue += item.totalPrice;

    // Calculate profit
    if (item.serviceId && item.service) {
      // Services have no cost, so profit = revenue
      dayStats.profit += item.totalPrice;
    } else if (item.productId && item.product) {
      const initialPrice = item.initialPrice || item.product.initialPrice;
      dayStats.profit += item.totalPrice - initialPrice * item.amount;
    }
  });

  return grouped;
}
