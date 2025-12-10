"use client";

import { useMemo, useState } from "react";
import { Product } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  ShoppingCart,
  Calendar,
  DollarSign,
  Coins,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRangePicker, type DateRange, type DatePreset } from "@/components/DateRangePicker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

interface ProductAnalyticsProps {
  product: Product;
}

export function ProductAnalytics({ product }: ProductAnalyticsProps) {
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
    let todayRevenue = 0;
    let weeklyRevenue = 0;
    let todaySold = 0;
    let weeklySold = 0;
    let filteredProfit = 0;
    let filteredRevenue = 0;
    let filteredSold = 0;

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
          todayRevenue += history.totalPrice;
          todaySold += history.amount;
        }

        // Check if sale is within last 7 days
        if (sellDate >= weekAgo) {
          weeklyProfit += saleProfit;
          weeklyRevenue += history.totalPrice;
          weeklySold += history.amount;
        }

        // Filter by date range if set
        if (isInDateRange(sellDate)) {
          filteredProfit += saleProfit;
          filteredRevenue += history.totalPrice;
          filteredSold += history.amount;
        }
      });
    }

    // Use filtered values if date range is set, otherwise use product totals
    const useFiltered = datePreset !== "all";
    const displayRevenue = useFiltered ? filteredRevenue : (product.revenue || 0);
    const displaySold = useFiltered ? filteredSold : (product.totalSold || 0);
    const displayProfit = useFiltered ? filteredProfit : (product.profit || 0);

    return {
      totalRevenue: displayRevenue,
      totalSold: displaySold,
      totalProfit: displayProfit,
      todayProfit,
      weeklyProfit,
      todayRevenue,
      weeklyRevenue,
      todaySold,
      weeklySold,
    };
  }, [product, dateRange, datePreset]);

  const stats = [
    {
      title: "Total Revenue",
      value: analytics.totalRevenue,
      icon: DollarSign,
      description: "Total revenue from all sales",
      isProfit: false,
      isCurrency: true,
    },
    {
      title: "Total Items Sold",
      value: analytics.totalSold,
      icon: ShoppingCart,
      description: "Total quantity sold",
      isProfit: false,
      isCurrency: false,
    },
    {
      title: "Today's Profit",
      value: analytics.todayProfit,
      icon: Calendar,
      description: "Profit from today's sales",
      isProfit: true,
      isCurrency: true,
    },
    {
      title: "Weekly Profit",
      value: analytics.weeklyProfit,
      icon: TrendingUp,
      description: "Profit from last 7 days",
      isProfit: true,
      isCurrency: true,
    },
    {
      title: "Total Profit",
      value: analytics.totalProfit,
      icon: Coins,
      description: "Overall profit",
      isProfit: true,
      isCurrency: true,
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
          Product Analytics
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {/* Analytics cards - hidden by default, shown when expanded */}
      <div className={cn(isExpanded ? "block" : "hidden")}>
        <div className="mb-4">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            preset={datePreset}
            onPresetChange={setDatePreset}
          />
        </div>
        <div
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          )}
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
                    {stat.isCurrency ? (
                      stat.isProfit ? (
                        <span
                          className={isPositive ? "text-green-400" : "text-red-400"}
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

