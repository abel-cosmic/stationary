"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import type { Category } from "@/types/api";
import { exportCategoriesToExcel } from "@/lib/excel-utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface CategoryExportButtonProps {
  categories: Category[];
}

export function CategoryExportButton({
  categories,
}: CategoryExportButtonProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (categories.length === 0) {
      alert(t("common.export.noCategoriesToExport"));
      return;
    }

    setIsExporting(true);
    try {
      exportCategoriesToExcel(categories);
    } catch (error) {
      console.error("Export error:", error);
      alert(t("common.export.failedToExport"));
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
          <span className="hidden sm:inline">
            {t("common.export.exporting")}
          </span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t("common.export.exportCategories")}
          </span>
          <span className="sm:hidden">{t("common.export.export")}</span>
        </>
      )}
    </Button>
  );
}
