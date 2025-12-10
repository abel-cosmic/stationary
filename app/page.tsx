"use client";

import { useState, useMemo } from "react";
import { useProducts } from "@/lib/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { ProductTable } from "@/components/ProductTable";
import { SearchBar } from "@/components/SearchBar";
import { CreateProductDialog } from "@/components/CreateProductDialog";
import { ExportDialog } from "@/components/ExportDialog";
import { ImportButton } from "@/components/ImportButton";
import { ViewSwitcher, type ViewMode } from "@/components/ViewSwitcher";
import { Analytics } from "@/components/Analytics";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: products, isLoading, error } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();
    return products.filter((product) =>
      product.name.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Stationery Inventory</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your stationery products and track sales
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-wrap gap-2">
            <ImportButton />
            <ExportDialog products={products || []} />
            <CreateProductDialog />
          </div>
        </div>

        {products && products.length > 0 && (
          <Analytics products={products} />
        )}

        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
          <div className="flex-1 min-w-0">
            <SearchBar onSearch={setSearchQuery} />
          </div>
          <div className="flex-shrink-0">
            <ViewSwitcher view={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchQuery
                ? "No products found matching your search."
                : "No products available. Create your first product to get started."}
            </p>
          </div>
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full px-4 sm:px-0">
              <ProductTable products={filteredProducts} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
