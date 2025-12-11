"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { Product, SellHistory } from "@/lib/api";
import { exportSellHistoryToExcel } from "@/lib/excel-utils";
import { useState, useMemo } from "react";

interface SellHistoryExportButtonProps {
  products: Product[];
}

export function SellHistoryExportButton({
  products,
}: SellHistoryExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Extract all sell history from products
  const allSellHistory = useMemo(() => {
    const history: SellHistory[] = [];
    products.forEach((product) => {
      if (product.sellHistory && product.sellHistory.length > 0) {
        history.push(...product.sellHistory);
      }
    });
    return history;
  }, [products]);

  const handleExport = () => {
    if (allSellHistory.length === 0) {
      alert("No sell history to export");
      return;
    }

    setIsExporting(true);
    try {
      exportSellHistoryToExcel(allSellHistory, products);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || allSellHistory.length === 0}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="hidden sm:inline">Exporting...</span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export Sell History</span>
          <span className="sm:hidden">Export</span>
        </>
      )}
    </Button>
  );
}
