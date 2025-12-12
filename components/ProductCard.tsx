"use client";

import { Button } from "@/components/ui/button";
import { Product } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Package, DollarSign, TrendingUp, Edit, Trash2 } from "lucide-react";
import { EditProductDialog } from "@/components/EditProductDialog";
import { DeleteButton } from "@/components/DeleteButton";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Package className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold truncate">
            {product.name}
          </h3>
        </div>
        <div className="flex gap-1 shrink-0">
          <EditProductDialog
            product={product}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 sm:h-9 sm:w-9 p-0 touch-manipulation"
                title={t("common.product.edit")}
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
                title={t("common.product.delete")}
              >
                <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
            }
          />
        </div>
      </div>
      {product.category && (
        <div>
          <span className="px-2 py-1 rounded bg-muted text-xs">
            {product.category.name}
          </span>
        </div>
      )}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t("common.product.quantityLabel")}
          </span>
          <span className="font-semibold text-base">{product.quantity}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t("common.product.sellingPriceLabel")}
          </span>
          <span className="font-semibold flex items-center gap-1 text-base">
            <DollarSign className="h-4 w-4" />
            {product.sellingPrice.toFixed(2)} ETB
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t("common.product.profit")}
          </span>
          <span
            className={cn(
              "font-semibold flex items-center gap-1 text-base",
              product.profit >= 0 ? "text-green-400" : "text-red-400"
            )}
          >
            <TrendingUp className="h-4 w-4" />
            {product.profit.toFixed(2)} ETB
          </span>
        </div>
      </div>
      <Button
        onClick={() => router.push(`/products/${product.id}`)}
        className="w-full h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
        size="default"
      >
        {t("common.buttons.viewDetails")}
      </Button>
    </div>
  );
}
