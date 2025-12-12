"use client";

import { useMemo, useState } from "react";
import { Product } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Package,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DateRangePicker,
  type DateRange,
  type DatePreset,
} from "@/components/DateRangePicker";
import { AnalyticsExportButton } from "@/components/AnalyticsExportButton";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { useTranslation } from "react-i18next";

interface AnalyticsProps {
  products: Product[];
}

export function Analytics({ products }: AnalyticsProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [datePreset, setDatePreset] = useState<DatePreset>("all");

  const analytics = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    let todayProfit = 0;
    let weeklyProfit = 0;
    let totalProfit = 0;
    let filteredProfit = 0;
    let filteredRevenue = 0;
    let filteredSold = 0;
    const totalProducts = products.length;

    // Helper function to check if a date is within the selected range
    const isInDateRange = (date: Date): boolean => {
      if (!dateRange.from && !dateRange.to) {
        return true; // "All time" - include all dates
      }
      if (dateRange.from && dateRange.to) {
        return isWithinInterval(date, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to),
        });
      }
      if (dateRange.from) {
        return date >= startOfDay(dateRange.from);
      }
      if (dateRange.to) {
        return date <= endOfDay(dateRange.to);
      }
      return true;
    };

    products.forEach((product) => {
      // Total profit is already calculated in the product
      totalProfit += product.profit || 0;

      // Calculate daily and weekly profit from sell history
      if (product.sellHistory && product.sellHistory.length > 0) {
        product.sellHistory.forEach((history) => {
          const sellDate = new Date(history.createdAt);

          // Calculate profit for this specific sale
          const initialCost = product.initialPrice * history.amount;
          const saleProfit = history.totalPrice - initialCost;

          // Check if sale is today (same day, ignoring time)
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

          // Check if sale is within last 7 days
          if (sellDate >= weekAgo) {
            weeklyProfit += saleProfit;
          }

          // Filter by date range if set
          if (isInDateRange(sellDate)) {
            filteredProfit += saleProfit;
            filteredRevenue += history.totalPrice;
            filteredSold += history.amount;
          }
        });
      }
    });

    // Use filtered values if date range is set, otherwise use default calculations
    const useFiltered = datePreset !== "all";
    const displayProfit = useFiltered ? filteredProfit : totalProfit;

    return {
      todayProfit,
      weeklyProfit,
      totalProfit: displayProfit,
      totalProducts,
      filteredProfit,
      filteredRevenue,
      filteredSold,
    };
  }, [products, dateRange, datePreset]);

  const stats = [
    {
      title: t("common.analytics.totalProducts"),
      value: analytics.totalProducts,
      icon: Package,
      description: t("common.analytics.productsInInventory"),
    },
    {
      title: t("common.analytics.todaysProfit"),
      value: analytics.todayProfit,
      icon: Calendar,
      description: t("common.analytics.profitFromTodaysSales"),
      isProfit: true,
    },
    {
      title: t("common.analytics.weeklyProfit"),
      value: analytics.weeklyProfit,
      icon: TrendingUp,
      description: t("common.analytics.profitFromLast7Days"),
      isProfit: true,
    },
    {
      title: t("common.analytics.totalProfit"),
      value: analytics.totalProfit,
      icon: DollarSign,
      description: t("common.analytics.overallProfit"),
      isProfit: true,
    },
  ];

  return (
    <div className="mb-6">
      {/* Toggle button - visible on all screen sizes */}
      <Button
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full mb-4 flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {t("common.analytics.analytics")}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {/* Analytics cards - hidden by default, shown when expanded */}
      <div className={cn(isExpanded ? "block" : "hidden")}>
        <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            preset={datePreset}
            onPresetChange={setDatePreset}
          />
          <AnalyticsExportButton products={products} />
        </div>
        <div
          className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4")}
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isPositive = stat.isProfit ? stat.value >= 0 : true;

            return (
              <Card
                key={stat.title}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stat.isProfit ? (
                      <span
                        className={
                          isPositive ? "text-green-400" : "text-red-400"
                        }
                      >
                        {stat.value >= 0 ? "+" : ""}
                        {stat.value.toFixed(2)} ETB
                      </span>
                    ) : (
                      <span>{stat.value}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
