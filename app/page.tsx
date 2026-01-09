"use client";

import { useTranslation } from "react-i18next";
import { useCategories } from "@/lib/hooks/use-categories";
import { useProducts } from "@/lib/hooks/use-products";
import { useServices } from "@/lib/hooks/use-services";
import { useSearch } from "@/lib/hooks/use-search";
import { CategoryTable } from "@/layouts/home/category-table";
import { CategoryManager } from "@/layouts/home/category-manager";
import { CategoryExportButton } from "@/layouts/home/category-export-button";
import { ImportButton } from "@/layouts/home/import-button";
import { OverviewAnalytics } from "@/layouts/home/overview-analytics";
import { ThemeToggle } from "@/layouts/common/theme-toggle";
import { LanguageToggle } from "@/layouts/common/language-toggle";
import { QuickServiceDialog } from "@/layouts/services/quick-service-dialog";
import { ServiceManager } from "@/layouts/services/service-manager";
import { SearchBar } from "@/layouts/categories/search-bar";
import {
  Loader2,
  FolderTree,
  Plus,
  ShoppingCart,
  Settings,
  Receipt,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

  // Search functionality for categories
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    filteredItems: filteredCategories,
  } = useSearch(
    "home-categories",
    categories || [],
    (category, query) =>
      category.name.toLowerCase().includes(query.toLowerCase())
  );

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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="flex items-start justify-between gap-3 mb-6 sm:mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <FolderTree className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary" />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold">
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
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link href="/quick-sell">
                <Button size="lg" className="h-11 px-6">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {t("common.quickSell.title")}
                </Button>
              </Link>
              <QuickServiceDialog />
              <Link href="/expenses">
                <Button variant="outline" size="lg" className="h-11 px-6">
                  <Receipt className="mr-2 h-5 w-5" />
                  {t("common.expenses.title") || "Expenses"}
                </Button>
              </Link>
              <Link href="/debits">
                <Button variant="outline" size="lg" className="h-11 px-6">
                  <FileText className="mr-2 h-5 w-5" />
                  {t("common.debits.title") || "Debits"}
                </Button>
              </Link>
            </div>
          </div>

          {/* Management Tools Section */}
          <div className="mb-6 sm:mb-8 lg:mb-10">
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-muted-foreground">
                {t("common.managementTools") || "Management Tools"}
              </h2>
            </div>
            <div className="border rounded-lg bg-card p-4 sm:p-6">
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <CategoryManager />
                <ServiceManager />
                {categories && categories.length > 0 && (
                  <>
                    <CategoryExportButton categories={categories} />
                    <ImportButton />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          {categories && products && (
            <OverviewAnalytics
              categories={categories}
              products={products}
              services={services}
            />
          )}
        </div>

        {/* Categories Section */}
        {categories && categories.length > 0 ? (
          <div className="space-y-6 sm:space-y-8">
            <div className="border-t pt-6 sm:pt-8">
              <div className="mb-4 sm:mb-6">
                <SearchBar onSearch={setSearchQuery} />
              </div>
              {filteredCategories.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <p className="text-muted-foreground text-base sm:text-lg">
                    {searchQuery
                      ? t("common.search.noResults")
                      : t("common.noCategories")}
                  </p>
                </div>
              ) : (
                <CategoryTable categories={filteredCategories} />
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 sm:py-20 border-t pt-12 sm:pt-16">
            <FolderTree className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-lg sm:text-xl mb-6">
              {t("common.noCategories")}
            </p>
            <CategoryManager
              trigger={
                <Button size="lg" className="h-11 px-6">
                  <Plus className="mr-2 h-5 w-5" />
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
