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
import { Package, DollarSign, TrendingUp, Edit, Trash2 } from "lucide-react";
import { EditProductDialog } from "@/components/EditProductDialog";
import { DeleteButton } from "@/components/DeleteButton";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  return (
    <Card className="hover:shadow-lg transition-shadow active:scale-[0.98]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg min-w-0 flex-1">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">{product.name}</span>
          </CardTitle>
          <div className="flex gap-1 flex-shrink-0">
            <EditProductDialog
              product={product}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 sm:h-9 sm:w-9 p-0 touch-manipulation"
                  title="Edit Product"
                >
                  <Edit className="h-5 w-5 sm:h-4 sm:w-4" />
                </Button>
              }
            />
            <DeleteButton
              productId={product.id}
              productName={product.name}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 sm:h-9 sm:w-9 p-0 text-destructive hover:text-destructive touch-manipulation"
                  title="Delete Product"
                >
                  <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                </Button>
              }
            />
          </div>
        </div>
        {product.category && (
          <div className="mt-2">
            <span className="px-2 py-1 rounded bg-muted text-xs">
              {product.category.name}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2.5 sm:space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Quantity:</span>
          <span className="font-semibold text-base">{product.quantity}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Selling Price:</span>
          <span className="font-semibold flex items-center gap-1 text-base">
            <DollarSign className="h-4 w-4" />
            {product.sellingPrice.toFixed(2)} ETB
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Profit:</span>
          <span
            className={`font-semibold flex items-center gap-1 text-base ${
              product.profit >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            {product.profit.toFixed(2)} ETB
          </span>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          onClick={() => router.push(`/products/${product.id}`)}
          className="w-full h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
          size="default"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
