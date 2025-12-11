"use client";

import { useMemo } from "react";
import { Product, Category } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderTree, Package, DollarSign, TrendingUp } from "lucide-react";

interface OverviewAnalyticsProps {
  categories: Category[];
  products: Product[];
}

export function OverviewAnalytics({
  categories,
  products,
}: OverviewAnalyticsProps) {
  const analytics = useMemo(() => {
    const totalCategories = categories.length;
    const totalProducts = products.length;
    let totalRevenue = 0;
    let totalProfit = 0;

    products.forEach((product) => {
      totalRevenue += product.revenue || 0;
      totalProfit += product.profit || 0;
    });

    return {
      totalCategories,
      totalProducts,
      totalRevenue,
      totalProfit,
    };
  }, [categories, products]);

  const stats = [
    {
      title: "Total Categories",
      value: analytics.totalCategories,
      icon: FolderTree,
      description: "Product categories",
    },
    {
      title: "Total Products",
      value: analytics.totalProducts,
      icon: Package,
      description: "Products in inventory",
    },
    {
      title: "Total Revenue",
      value: analytics.totalRevenue,
      icon: DollarSign,
      description: "Revenue from all sales",
      isCurrency: true,
    },
    {
      title: "Total Profit",
      value: analytics.totalProfit,
      icon: TrendingUp,
      description: "Overall profit",
      isCurrency: true,
      isProfit: true,
    },
  ];

  return (
    <div className="mb-4 sm:mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.isProfit ? stat.value >= 0 : true;

          return (
            <Card
              key={stat.title}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
                  {stat.title}
                </CardTitle>
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                  {stat.isCurrency ? (
                    stat.isProfit ? (
                      <span
                        className={
                          isPositive ? "text-green-400" : "text-red-400"
                        }
                      >
                        {stat.value >= 0 ? "+" : ""}
                        {stat.value.toFixed(2)} ETB
                      </span>
                    ) : (
                      <span>{stat.value.toFixed(2)} ETB</span>
                    )
                  ) : (
                    <span>{stat.value}</span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
