"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Package, DollarSign, TrendingUp } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {product.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Quantity:</span>
          <span className="font-semibold">{product.quantity}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Selling Price:</span>
          <span className="font-semibold flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            {product.sellingPrice.toFixed(2)} ETB
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Profit:</span>
          <span
            className={`font-semibold flex items-center gap-1 ${
              product.profit >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            {product.profit.toFixed(2)} ETB
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => router.push(`/products/${product.id}`)}
          className="w-full"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
