"use client";

import { Product } from "@/lib/api";
import {
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ProductSummaryCardProps {
  product: Product;
}

export function ProductSummaryCard({ product }: ProductSummaryCardProps) {
  const { t } = useTranslation();
  return (
    <div className="border rounded-lg p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-bold">
          <Package className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
          <span className="truncate">{product.name}</span>
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            {t("common.productSummary.initialPrice")}
          </div>
          <div className="text-base sm:text-lg font-semibold">
            {product.initialPrice.toFixed(2)} ETB
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            {t("common.productSummary.sellingPrice")}
          </div>
          <div className="text-base sm:text-lg font-semibold">
            {product.sellingPrice.toFixed(2)} ETB
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            {t("common.productSummary.stock")}
          </div>
          <div className="text-base sm:text-lg font-semibold">
            {product.quantity}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            {t("common.productSummary.totalSold")}
          </div>
          <div className="text-base sm:text-lg font-semibold">
            {product.totalSold}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
            <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            {t("common.productSummary.revenue")}
          </div>
          <div className="text-base sm:text-lg font-semibold">
            {product.revenue.toFixed(2)} ETB
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            {t("common.productSummary.profit")}
          </div>
          <div
            className={cn(
              "text-base sm:text-lg font-semibold",
              product.profit >= 0 ? "text-green-400" : "text-red-400"
            )}
          >
            {product.profit.toFixed(2)} ETB
          </div>
        </div>
      </div>
    </div>
  );
}
