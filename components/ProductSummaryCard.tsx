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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Package className="h-6 w-6" />
          {product.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Initial Price
            </div>
            <div className="text-lg font-semibold">
              {product.initialPrice.toFixed(2)} ETB
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Selling Price
            </div>
            <div className="text-lg font-semibold">
              {product.sellingPrice.toFixed(2)} ETB
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Package className="h-4 w-4" />
              Stock
            </div>
            <div className="text-lg font-semibold">{product.quantity}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" />
              Total Sold
            </div>
            <div className="text-lg font-semibold">{product.totalSold}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Coins className="h-4 w-4" />
              Revenue
            </div>
            <div className="text-lg font-semibold">
              {product.revenue.toFixed(2)} ETB
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Profit
            </div>
            <div
              className={`text-lg font-semibold ${
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

