"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { Product } from "@/types/api";
import { exportToExcel } from "@/lib/excel-utils";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAlert } from "@/lib/hooks/use-alert";

interface ExportButtonProps {
  products: Product[];
}

export function ExportButton({ products }: ExportButtonProps) {
  const { t } = useTranslation();
  const { showAlert, AlertComponent } = useAlert();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (products.length === 0) {
      await showAlert(t("common.export.noProductsToExport"));
      return;
    }

    setIsExporting(true);
    try {
      exportToExcel(products);
    } catch (error) {
      console.error("Export error:", error);
      await showAlert(t("common.export.failedToExport"));
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
          <span className="hidden sm:inline">
            {t("common.export.exporting")}
          </span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t("common.export.exportExcel")}
          </span>
          <span className="sm:hidden">{t("common.export.export")}</span>
        </>
      )}
    </Button>
    <>
      <AlertComponent />
    </>
  );
}
