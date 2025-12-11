"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { Category } from "@/lib/api";
import { exportCategoriesToExcel } from "@/lib/excel-utils";
import { useState } from "react";

interface CategoryExportButtonProps {
  categories: Category[];
}

export function CategoryExportButton({
  categories,
}: CategoryExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (categories.length === 0) {
      alert("No categories to export");
      return;
    }

    setIsExporting(true);
    try {
      exportCategoriesToExcel(categories);
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
      disabled={isExporting || categories.length === 0}
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
          <span className="hidden sm:inline">Export Categories</span>
          <span className="sm:hidden">Export</span>
        </>
      )}
    </Button>
  );
}
