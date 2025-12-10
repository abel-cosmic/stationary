"use client";

import { use, useState } from "react";
import { useProduct } from "@/lib/hooks/use-products";
import { ProductSummaryCard } from "@/components/ProductSummaryCard";
import { ProductAnalytics } from "@/components/ProductAnalytics";
import { SellProductDialog } from "@/components/SellProductDialog";
import { EditProductDialog } from "@/components/EditProductDialog";
import { DeleteButton } from "@/components/DeleteButton";
import { SellHistoryTable } from "@/components/SellHistoryTable";
import { SellHistoryCards } from "@/components/SellHistoryCards";
import { ViewSwitcher, type ViewMode } from "@/components/ViewSwitcher";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const productId = parseInt(id);
  const router = useRouter();
  const { data: product, isLoading, error } = useProduct(productId);
  const [historyViewMode, setHistoryViewMode] = useState<ViewMode>("table");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Product not found</p>
          <Button
            onClick={() => router.push("/")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 sm:mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to Products</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </Link>

        <div className="space-y-4 sm:space-y-6">
          <ProductSummaryCard product={product} />

          <ProductAnalytics product={product} />

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1 sm:flex-initial">
              <SellProductDialog product={product} />
            </div>
            <div className="flex-1 sm:flex-initial">
              <EditProductDialog product={product} />
            </div>
            <div className="flex-1 sm:flex-initial">
              <DeleteButton
                productId={product.id}
                productName={product.name}
              />
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-bold">Sell History</h2>
              <ViewSwitcher
                view={historyViewMode}
                onViewChange={setHistoryViewMode}
              />
            </div>
            {historyViewMode === "table" ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full px-4 sm:px-0">
                  <SellHistoryTable history={product.sellHistory || []} />
                </div>
              </div>
            ) : (
              <SellHistoryCards history={product.sellHistory || []} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

