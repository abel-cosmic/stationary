"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { Product } from "@/lib/api";
import { exportAnalyticsToExcel } from "@/lib/excel-utils";
import { useState } from "react";

interface AnalyticsExportButtonProps {
  products: Product[];
}

export function AnalyticsExportButton({
  products,
}: AnalyticsExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (products.length === 0) {
      alert("No products available for analytics export");
      return;
    }

    setIsExporting(true);
    try {
      exportAnalyticsToExcel(products);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export analytics. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || products.length === 0}
      variant="outline"
      size="sm"
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
          <span className="hidden sm:inline">Export Analytics</span>
          <span className="sm:hidden">Export</span>
        </>
      )}
    </Button>
  );
}
