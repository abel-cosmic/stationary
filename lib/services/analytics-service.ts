import type { Product, Service, Category } from "@/types/api";

export interface CategoryAnalytics {
  productCount: number;
  categoryRevenue: number;
  categoryProfit: number;
  itemsSold: number;
}

export interface OverviewAnalytics {
  totalCategories: number;
  totalProducts: number;
  totalRevenue: number;
  totalProfit: number;
}

/**
 * Calculate analytics for a category based on its products
 */
export function calculateCategoryAnalytics(
  products: Product[]
): CategoryAnalytics {
  const productCount = products.length;
  let categoryRevenue = 0;
  let categoryProfit = 0;
  let itemsSold = 0;

  products.forEach((product) => {
    categoryRevenue += product.revenue || 0;
    categoryProfit += product.profit || 0;
    itemsSold += product.totalSold || 0;
  });

  return {
    productCount,
    categoryRevenue,
    categoryProfit,
    itemsSold,
  };
}

/**
 * Calculate overview analytics for all categories, products, and services
 */
export function calculateOverviewAnalytics(
  categories: Category[],
  products: Product[],
  services: Service[] = []
): OverviewAnalytics {
  const totalCategories = categories.length;
  const totalProducts = products.length;
  let totalRevenue = 0;
  let totalProfit = 0;

  products.forEach((product) => {
    totalRevenue += product.revenue || 0;
    totalProfit += product.profit || 0;
  });

  // Add service revenue (services have no cost, so revenue = profit)
  services.forEach((service) => {
    totalRevenue += service.revenue || 0;
    totalProfit += service.revenue || 0; // Services: profit = revenue (no cost)
  });

  return {
    totalCategories,
    totalProducts,
    totalRevenue,
    totalProfit,
  };
}

/**
 * Calculate profit margin percentage
 */
export function calculateProfitMargin(revenue: number, profit: number): number {
  if (revenue === 0) return 0;
  return (profit / revenue) * 100;
}

/**
 * Calculate average revenue per transaction
 */
export function calculateAverageRevenue(
  totalRevenue: number,
  transactionCount: number
): number {
  if (transactionCount === 0) return 0;
  return totalRevenue / transactionCount;
}
