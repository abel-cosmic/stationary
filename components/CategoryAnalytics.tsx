"use client";

import { useMemo } from "react";
import { Product } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, TrendingUp, ShoppingCart } from "lucide-react";

interface CategoryAnalyticsProps {
  products: Product[];
}

export function CategoryAnalytics({ products }: CategoryAnalyticsProps) {
  const analytics = useMemo(() => {
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
  }, [products]);

  const stats = [
    {
      title: "Products",
      value: analytics.productCount,
      icon: Package,
      description: "Products in this category",
    },
    {
      title: "Category Revenue",
      value: analytics.categoryRevenue,
      icon: DollarSign,
      description: "Total revenue from category",
      isCurrency: true,
    },
    {
      title: "Category Profit",
      value: analytics.categoryProfit,
      icon: TrendingUp,
      description: "Total profit from category",
      isCurrency: true,
      isProfit: true,
    },
    {
      title: "Items Sold",
      value: analytics.itemsSold,
      icon: ShoppingCart,
      description: "Total items sold",
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
