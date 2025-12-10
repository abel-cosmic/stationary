"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Product } from "@/lib/api";
import { exportToExcel } from "@/lib/excel-utils";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ExportButtonProps {
  products: Product[];
}

export function ExportButton({ products }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (products.length === 0) {
      alert("No products to export");
      return;
    }

    setIsExporting(true);
    try {
      exportToExcel(products);
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
      disabled={isExporting || products.length === 0}
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
          <span className="hidden sm:inline">Export Excel</span>
          <span className="sm:hidden">Export</span>
        </>
      )}
    </Button>
  );
}

