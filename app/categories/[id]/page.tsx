"use client";

import { use, useMemo } from "react";
import { useSearch } from "@/lib/hooks/use-search";
import { useCategories } from "@/lib/hooks/use-categories";
import { useProducts } from "@/lib/hooks/use-products";
import { ProductTable } from "@/layouts/categories/product-table";
import { SearchBar } from "@/layouts/categories/search-bar";
import { CreateProductDialog } from "@/layouts/categories/create-product-dialog";
import { ExportDialog } from "@/layouts/categories/export-dialog";
import { CategoryAnalytics } from "@/layouts/categories/category-analytics";
import { ThemeToggle } from "@/layouts/common/theme-toggle";
import { LanguageToggle } from "@/layouts/common/language-toggle";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, FolderTree } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function CategoryProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useTranslation();
  const { id } = use(params);
  const categoryId = parseInt(id);
  const router = useRouter();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: products, isLoading: productsLoading, error } = useProducts();

  const category = categories?.find((cat) => cat.id === categoryId);
  const isLoading = categoriesLoading || productsLoading;

  const categoryProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((product) => product.categoryId === categoryId);
  }, [products, categoryId]);

  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    filteredItems: filteredProducts,
  } = useSearch(`category-${categoryId}`, categoryProducts, (product, query) =>
    product.name.toLowerCase().includes(query.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">
            {error
              ? t("common.errors.loadingProducts")
              : t("common.errors.categoryNotFound")}
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

        <div className="mb-4 sm:mb-6 lg:mb-8 flex flex-col gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <FolderTree className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold">
                {category.name}
              </h1>
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
              {categoryProducts.length}{" "}
              {categoryProducts.length !== 1
                ? t("common.product.productsPlural")
                : t("common.product.products")}{" "}
              {t("common.category.productsInCategory")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <CreateProductDialog categoryId={categoryId} />
            {categoryProducts.length > 0 && (
              <ExportDialog products={categoryProducts} />
            )}
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <CategoryAnalytics products={categoryProducts} />
        </div>

        <div className="mb-3 sm:mb-4 lg:mb-6">
          <SearchBar onSearch={setSearchQuery} />
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-muted-foreground text-base sm:text-lg">
              {searchQuery
                ? t("common.search.noResults")
                : t("common.category.noProductsInCategory")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="inline-block min-w-full px-3 sm:px-0">
              <ProductTable products={filteredProducts} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
