"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@/lib/api";
import { Package, DollarSign, TrendingUp, ShoppingCart, Coins } from "lucide-react";

interface ProductSummaryCardProps {
  product: Product;
}

export function ProductSummaryCard({ product }: ProductSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
          <Package className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
          <span className="truncate">{product.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              Initial Price
            </div>
            <div className="text-base sm:text-lg font-semibold">
              {product.initialPrice.toFixed(2)} ETB
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              Selling Price
            </div>
            <div className="text-base sm:text-lg font-semibold">
              {product.sellingPrice.toFixed(2)} ETB
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              Stock
            </div>
            <div className="text-base sm:text-lg font-semibold">{product.quantity}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              Total Sold
            </div>
            <div className="text-base sm:text-lg font-semibold">{product.totalSold}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              Revenue
            </div>
            <div className="text-base sm:text-lg font-semibold">
              {product.revenue.toFixed(2)} ETB
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              Profit
            </div>
            <div
              className={`text-base sm:text-lg font-semibold ${
                product.profit >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {product.profit.toFixed(2)} ETB
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

