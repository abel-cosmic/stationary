"use client";

import { use } from "react";
import { useProduct } from "@/lib/hooks/use-products";
import { ProductSummaryCard } from "@/layouts/products/product-summary-card";
import { ProductAnalytics } from "@/layouts/products/product-analytics";
import { SellProductDialog } from "@/layouts/products/sell-product-dialog";
import { EditProductDialog } from "@/layouts/products/edit-product-dialog";
import { DeleteButton } from "@/layouts/products/delete-button";
import { SellHistoryTable } from "@/layouts/products/sell-history-table";
import { ThemeToggle } from "@/layouts/common/theme-toggle";
import { LanguageToggle } from "@/layouts/common/language-toggle";
import {
  Accordion,
  AccordionContent,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, ArrowLeft, MoreVertical, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useTranslation();
  const { id } = use(params);
  const productId = parseInt(id);
  const router = useRouter();
  const { data: product, isLoading, error } = useProduct(productId);

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
          <p className="text-destructive mb-2">
            {t("common.errors.productNotFound")}
          </p>
          <Button onClick={() => router.push("/")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.backToHome")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="mb-3 sm:mb-4 lg:mb-6 flex items-center justify-between gap-2">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 sm:h-9 touch-manipulation"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t("common.backToHome")}</span>
              <span className="sm:hidden">{t("common.back")}</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          <ProductSummaryCard product={product} />

          <ProductAnalytics product={product} />

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
            <div className="flex-1 sm:flex-initial">
              <SellProductDialog product={product} />
            </div>
            <div className="flex-1 sm:flex-initial">
              <EditProductDialog product={product} />
            </div>
            <div className="flex-1 sm:flex-initial">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
                  >
                    <MoreVertical className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">
                      {t("common.buttons.moreActions")}
                    </span>
                    <span className="sm:hidden">
                      {t("common.buttons.more")}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                    {t("common.buttons.viewDetails")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DeleteButton
                    productId={product.id}
                    productName={product.name}
                    trigger={
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                      >
                        {t("common.product.delete")}
                      </DropdownMenuItem>
                    }
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Accordion defaultOpen={false}>
            <div className="border rounded-lg">
              <AccordionTrigger className="px-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {t("common.sellHistory.title")}
                  </h2>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full px-4 sm:px-0">
                    <SellHistoryTable history={product.sellHistory || []} />
                  </div>
                </div>
              </AccordionContent>
            </div>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
