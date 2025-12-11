"use client";

import { useState } from "react";
import { useCategories } from "@/lib/hooks/use-categories";
import { useProducts } from "@/lib/hooks/use-products";
import { CategoryCard } from "@/components/CategoryCard";
import { CategoryTable } from "@/components/CategoryTable";
import { CategoryManager } from "@/components/CategoryManager";
import { OverviewAnalytics } from "@/components/OverviewAnalytics";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ViewSwitcher, type ViewMode } from "@/components/ViewSwitcher";
import { Loader2, FolderTree, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("card");
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

  const isLoading = categoriesLoading || productsLoading;
  const error = categoriesError || productsError;

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
          <p className="text-destructive mb-2">Error loading products</p>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6 lg:mb-8 flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <FolderTree className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold">
                  Categories
                </h1>
              </div>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Select a category to view and manage products
              </p>
            </div>
            <div className="shrink-0">
              <ThemeToggle />
            </div>
          </div>
          <div className="shrink-0">
            <CategoryManager />
          </div>
        </div>

        {categories && products && (
          <div className="mb-4 sm:mb-6">
            <OverviewAnalytics categories={categories} products={products} />
          </div>
        )}

        {categories && categories.length > 0 ? (
          <>
            <div className="mb-3 sm:mb-4 lg:mb-6 flex justify-end">
              <ViewSwitcher view={viewMode} onViewChange={setViewMode} />
            </div>
            {viewMode === "card" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {categories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            ) : (
              <CategoryTable categories={categories} />
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <FolderTree className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg mb-4">
              No categories yet. Create your first category to get started.
            </p>
            <CategoryManager
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Category
                </Button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
