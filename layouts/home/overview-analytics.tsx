"use client";

import { useMemo } from "react";
import type { Product, Category, Service } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
    <div className="mb-4 sm:mb-6">
      <Accordion defaultOpen={false}>
        <div className="border rounded-lg">
          <AccordionTrigger className="px-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>{t("common.analytics.overview")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4">
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
          </AccordionContent>
        </div>
      </Accordion>
    </div>
  );
}
