"use client";

import { useTranslation } from "react-i18next";
import { useCategories } from "@/lib/hooks/use-categories";
import { useProducts } from "@/lib/hooks/use-products";
import { useServices } from "@/lib/hooks/use-services";
import { CategoryTable } from "@/layouts/home/category-table";
import { CategoryManager } from "@/layouts/home/category-manager";
import { CategoryExportButton } from "@/layouts/home/category-export-button";
import { ImportButton } from "@/layouts/home/import-button";
import { OverviewAnalytics } from "@/layouts/home/overview-analytics";
import { ThemeToggle } from "@/layouts/common/theme-toggle";
import { LanguageToggle } from "@/layouts/common/language-toggle";
import { QuickServiceDialog } from "@/layouts/services/quick-service-dialog";
import { ServiceManager } from "@/layouts/services/service-manager";
import {
  Loader2,
  FolderTree,
  Plus,
  ShoppingCart,
  Wrench,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

export default function Home() {
  const { t } = useTranslation();
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = useProducts();
  const {
    data: services,
    isLoading: servicesLoading,
    error: servicesError,
  } = useServices();

  const isLoading = categoriesLoading || productsLoading || servicesLoading;
  const error = categoriesError || productsError || servicesError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">
            {t("common.errors.loadingProducts")}
          </p>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error
              ? error.message
              : t("common.errors.unknownError")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold">
                  {t("common.categories")}
                </h1>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap gap-2">
            <Link href="/quick-sell">
              <Button>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {t("common.quickSell.title")}
              </Button>
            </Link>
            <QuickServiceDialog />
          </div>

          {/* Secondary Actions - Collapsed */}
          <Accordion defaultOpen={false} className="w-full">
            <div className="border rounded-lg">
              <AccordionTrigger className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {t("common.managementTools") || "Management Tools"}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  <CategoryManager />
                  <ServiceManager />
                  {categories && categories.length > 0 && (
                    <>
                      <CategoryExportButton categories={categories} />
                      <ImportButton />
                    </>
                  )}
                </div>
              </AccordionContent>
            </div>
          </Accordion>

          {/* Analytics - Collapsed */}
          {categories && products && (
            <OverviewAnalytics
              categories={categories}
              products={products}
              services={services}
            />
          )}
        </div>

        {categories && categories.length > 0 ? (
          <CategoryTable categories={categories} />
        ) : (
          <div className="text-center py-12">
            <FolderTree className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg mb-4">
              {t("common.noCategories")}
            </p>
            <CategoryManager
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("common.buttons.createCategory")}
                </Button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
