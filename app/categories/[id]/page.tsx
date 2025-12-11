"use client";

import { use, useState, useMemo } from "react";
import { useCategories } from "@/lib/hooks/use-categories";
import { useProducts } from "@/lib/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { ProductTable } from "@/components/ProductTable";
import { SearchBar } from "@/components/SearchBar";
import { CreateProductDialog } from "@/components/CreateProductDialog";
import { ViewSwitcher, type ViewMode } from "@/components/ViewSwitcher";
import { CategoryAnalytics } from "@/components/CategoryAnalytics";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, FolderTree } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CategoryProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const categoryId = parseInt(id);
  const router = useRouter();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: products, isLoading: productsLoading, error } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const category = categories?.find((cat) => cat.id === categoryId);
  const isLoading = categoriesLoading || productsLoading;

  const categoryProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((product) => product.categoryId === categoryId);
  }, [products, categoryId]);

  const filteredProducts = useMemo(() => {
    if (!categoryProducts) return [];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return categoryProducts.filter((product) =>
        product.name.toLowerCase().includes(query)
      );
    }

    return categoryProducts;
  }, [categoryProducts, searchQuery]);

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
            {error ? "Error loading products" : "Category not found"}
          </p>
          <Button onClick={() => router.push("/")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-3 sm:mb-4 lg:mb-6 h-10 sm:h-9 touch-manipulation">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to Categories</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </Link>

        <div className="mb-4 sm:mb-6 lg:mb-8 flex flex-col gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <FolderTree className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold">
                {category.name}
              </h1>
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
              {categoryProducts.length} product
              {categoryProducts.length !== 1 ? "s" : ""} in this category
            </p>
          </div>
          <div className="flex-shrink-0">
            <CreateProductDialog categoryId={categoryId} />
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <CategoryAnalytics products={categoryProducts} />
        </div>

        <div className="mb-3 sm:mb-4 lg:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 items-stretch sm:items-center">
          <div className="flex-1 min-w-0">
            <SearchBar onSearch={setSearchQuery} />
          </div>
          <div className="flex-shrink-0">
            <ViewSwitcher view={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-muted-foreground text-base sm:text-lg">
              {searchQuery
                ? "No products found matching your search."
                : "No products in this category yet. Create your first product to get started."}
            </p>
          </div>
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
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
