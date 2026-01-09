"use client";

import { useMemo } from "react";
import type { Product, Category, Service } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderTree, Package, DollarSign, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface OverviewAnalyticsProps {
  categories: Category[];
  products: Product[];
  services?: Service[];
}

export function OverviewAnalytics({
  categories,
  products,
  services = [],
}: OverviewAnalyticsProps) {
  const { t } = useTranslation();
  const analytics = useMemo(() => {
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
  }, [categories, products, services]);

  const stats = [
    {
      title: t("common.analytics.totalCategories"),
      value: analytics.totalCategories,
      icon: FolderTree,
      description: t("common.analytics.productCategories"),
    },
    {
      title: t("common.analytics.totalProducts"),
      value: analytics.totalProducts,
      icon: Package,
      description: t("common.analytics.productsInInventory"),
    },
    {
      title: t("common.analytics.totalRevenue"),
      value: analytics.totalRevenue,
      icon: DollarSign,
      description: t("common.analytics.revenueFromAllSales"),
      isCurrency: true,
    },
    {
      title: t("common.analytics.totalProfit"),
      value: analytics.totalProfit,
      icon: TrendingUp,
      description: t("common.analytics.overallProfit"),
      isCurrency: true,
      isProfit: true,
    },
  ];

  return (
    <div className="mb-6 sm:mb-8 lg:mb-10">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">
          {t("common.analytics.overview")}
        </h2>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.isProfit ? stat.value >= 0 : true;

          return (
            <Card
              key={stat.title}
              className="hover:shadow-lg transition-all duration-200 hover:border-primary/20"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-sm sm:text-base font-semibold leading-tight">
                  {stat.title}
                </CardTitle>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground flex-shrink-0 opacity-70" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                  {stat.isCurrency ? (
                    stat.isProfit ? (
                      <span
                        className={
                          isPositive ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"
                        }
                      >
                        {stat.value >= 0 ? "+" : ""}
                        {stat.value.toFixed(2)} ETB
                      </span>
                    ) : (
                      <span className="text-foreground">{stat.value.toFixed(2)} ETB</span>
                    )
                  ) : (
                    <span className="text-foreground">{stat.value}</span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
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
