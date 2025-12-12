"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Loader2, FileSpreadsheet } from "lucide-react";
import {
  parseExcelFile,
  parseExcelFileMultipleSheets,
} from "@/lib/excel-utils";
import { useCreateProduct } from "@/lib/hooks/use-products";
import { useCreateCategory } from "@/lib/hooks/use-categories";
import { useProducts } from "@/lib/hooks/use-products";
import { sellProduct } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";

export function ImportButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [importOptions, setImportOptions] = useState<{
    categories: boolean;
    products: boolean;
    sellHistory: boolean;
    analytics: boolean;
  }>({
    categories: false,
    products: true,
    sellHistory: false,
    analytics: false,
  });
  const [importStatus, setImportStatus] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const createProduct = useCreateProduct();
  const createCategory = useCreateCategory();
  const { data: products } = useProducts();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      if (ext !== "xlsx" && ext !== "xls") {
        alert(t("common.import.selectExcelFile"));
        return;
      }
      setFile(selectedFile);
      setImportStatus(null);
      setAvailableSheets([]); // Reset first

      // Detect available sheets in the file
      try {
        const sheets = await parseExcelFileMultipleSheets(selectedFile);
        setAvailableSheets(sheets);

        // Auto-select options based on available sheets
        setImportOptions({
          categories: sheets.includes("Categories"),
          products: sheets.includes("Products") || sheets.length > 0, // Default to first sheet if Products not found
          sellHistory: sheets.includes("Sell History"),
          analytics: false, // Analytics is read-only, not importable
        });
      } catch (error) {
        console.error("Error reading file:", error);
        // Even if sheet detection fails, allow import from first sheet
        setAvailableSheets(["Products"]); // Default assumption
        setImportOptions({
          categories: false,
          products: true,
          sellHistory: false,
          analytics: false,
        });
      }
    } else {
      setFile(null);
      setAvailableSheets([]);
      setImportOptions({
        categories: false,
        products: true,
        sellHistory: false,
        analytics: false,
      });
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    if (!importOptions.products && !importOptions.sellHistory) {
      alert("Please select at least one option to import");
      return;
    }

    setIsProcessing(true);
    setImportStatus(null);

    try {
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Import Categories
      if (importOptions.categories) {
        try {
          const sheetName = availableSheets.includes("Categories")
            ? "Categories"
            : availableSheets[0] || undefined;
          const data = await parseExcelFile(file, sheetName);

          const existingCategoryNames = new Set<string>();

          for (const row of data) {
            try {
              const categoryName = String(
                row["Category Name"] || row["Name"] || ""
              ).trim();

              if (!categoryName) {
                throw new Error(t("common.import.categoryNameRequired"));
              }

              // Skip if already processed in this batch
              if (existingCategoryNames.has(categoryName)) {
                throw new Error(
                  t("common.import.duplicateCategoryName", {
                    name: categoryName,
                  })
                );
              }
              existingCategoryNames.add(categoryName);

              await createCategory.mutateAsync({ name: categoryName });
              successCount++;
            } catch (error) {
              failedCount++;
              const errorMsg =
                error instanceof Error
                  ? error.message
                  : t("common.errors.unknownError");
              const rowIndex = data.indexOf(row) + 2;
              errors.push(
                `${t("common.import.categories")} - ${t(
                  "common.import.row"
                )} ${rowIndex}: ${errorMsg}`
              );
            }
          }
        } catch (error) {
          errors.push(
            `${t("common.import.categories")} ${t(
              "common.import.sheetsFound"
            )}: ${
              error instanceof Error
                ? error.message
                : t("common.import.failedToRead")
            }`
          );
        }
      }

      // Import Products
      if (importOptions.products) {
        try {
          // Try to use "Products" sheet if available, otherwise use first sheet
          const sheetName = availableSheets.includes("Products")
            ? "Products"
            : availableSheets[0] || undefined;
          const data = await parseExcelFile(file, sheetName);

          for (const row of data) {
            try {
              // Map Excel columns to product data
              const productData = {
                name: String(row["Product Name"] || row["Name"] || "").trim(),
                initialPrice: parseFloat(
                  row["Initial Price (ETB)"] || row["Initial Price"] || 0
                ),
                sellingPrice: parseFloat(
                  row["Selling Price (ETB)"] || row["Selling Price"] || 0
                ),
                quantity: parseInt(row["Quantity"] || row["Stock"] || 0),
              };

              // Validate data
              if (!productData.name) {
                throw new Error(t("common.import.productNameRequired"));
              }
              if (productData.initialPrice <= 0) {
                throw new Error(t("common.import.initialPriceMustBePositive"));
              }
              if (productData.sellingPrice <= 0) {
                throw new Error(t("common.import.sellingPriceMustBePositive"));
              }
              if (productData.quantity < 0 || isNaN(productData.quantity)) {
                throw new Error(t("common.import.quantityMustBeNonNegative"));
              }

              await createProduct.mutateAsync(productData);
              successCount++;
            } catch (error) {
              failedCount++;
              const errorMsg =
                error instanceof Error
                  ? error.message
                  : t("common.errors.unknownError");
              const rowIndex = data.indexOf(row) + 2;
              errors.push(
                `${t("common.import.products")} - ${t(
                  "common.import.row"
                )} ${rowIndex}: ${errorMsg}`
              );
            }
          }
        } catch (error) {
          errors.push(
            `${t("common.import.products")} ${t(
              "common.import.sheetsFound"
            )}: ${
              error instanceof Error
                ? error.message
                : t("common.errors.unknownError")
            }`
          );
        }
      }

      // Note: Sell History import would require matching products by ID/Name
      // This is complex and may not be needed, so we'll skip it for now
      if (importOptions.sellHistory) {
        errors.push(
          "Sell History import is not yet supported. Please import products first, then record sales manually."
        );
      }

      setImportStatus({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 10),
      });

      if (successCount > 0) {
        // Reset form after successful import
        setTimeout(() => {
          setFile(null);
          setOpen(false);
          setImportStatus(null);
          setAvailableSheets([]);
          setImportOptions({
            categories: false,
            products: true,
            sellHistory: false,
            analytics: false,
          });
        }, 3000);
      }
    } catch (error) {
      console.error("Import error:", error);
      alert(t("common.import.importFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Import Excel</span>
          <span className="sm:hidden">Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("common.import.title")}</DialogTitle>
          <DialogDescription>
            {t("common.import.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Excel File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="cursor-pointer"
              />
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                {file.name}
                {availableSheets.length > 0 && (
                  <span className="ml-2 text-xs">
                    ({availableSheets.length}{" "}
                    {availableSheets.length !== 1
                      ? t("common.import.sheetsFoundPlural")
                      : t("common.import.sheetsFound")}
                    )
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {t("common.import.importOptions")}
            </Label>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="import-categories"
                checked={importOptions.categories}
                disabled={
                  !!(
                    file &&
                    availableSheets.length > 0 &&
                    !availableSheets.includes("Categories")
                  )
                }
                onCheckedChange={(checked) =>
                  setImportOptions({
                    ...importOptions,
                    categories: checked === true,
                  })
                }
              />
              <Label
                htmlFor="import-categories"
                className={`text-sm font-normal ${
                  file &&
                  availableSheets.length > 0 &&
                  !availableSheets.includes("Categories")
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                Categories
                {file &&
                  availableSheets.length > 0 &&
                  !availableSheets.includes("Categories") && (
                    <span className="text-muted-foreground ml-2">
                      (Sheet not found)
                    </span>
                  )}
                {file && availableSheets.length === 0 && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    (Will import from first sheet)
                  </span>
                )}
                {!file && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    (Select file first)
                  </span>
                )}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="import-products"
                checked={importOptions.products}
                disabled={
                  !!(
                    file &&
                    availableSheets.length > 0 &&
                    !availableSheets.includes("Products")
                  )
                }
                onCheckedChange={(checked) =>
                  setImportOptions({
                    ...importOptions,
                    products: checked === true,
                  })
                }
              />
              <Label
                htmlFor="import-products"
                className={`text-sm font-normal ${
                  file &&
                  availableSheets.length > 0 &&
                  !availableSheets.includes("Products")
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {t("common.import.productList")}
                {file &&
                  availableSheets.length > 0 &&
                  !availableSheets.includes("Products") && (
                    <span className="text-muted-foreground ml-2">
                      {t("common.import.sheetNotFound")}
                    </span>
                  )}
                {file && availableSheets.length === 0 && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    {t("common.import.willImportFromFirstSheet")}
                  </span>
                )}
                {!file && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    {t("common.import.selectFileFirst")}
                  </span>
                )}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="import-history"
                checked={importOptions.sellHistory}
                disabled={
                  !file ||
                  (availableSheets.length > 0 &&
                    !availableSheets.includes("Sell History"))
                }
                onCheckedChange={(checked) =>
                  setImportOptions({
                    ...importOptions,
                    sellHistory: checked === true,
                  })
                }
              />
              <Label
                htmlFor="import-history"
                className={`text-sm font-normal ${
                  !file ||
                  (availableSheets.length > 0 &&
                    !availableSheets.includes("Sell History"))
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                Sell History
                {file &&
                  availableSheets.length > 0 &&
                  !availableSheets.includes("Sell History") && (
                    <span className="text-muted-foreground ml-2">
                      (Sheet not found)
                    </span>
                  )}
                {file && availableSheets.includes("Sell History") && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    (Requires products to exist)
                  </span>
                )}
                {!file && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    (Select file first)
                  </span>
                )}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="import-analytics"
                checked={importOptions.analytics}
                disabled={true}
                onCheckedChange={() => {}}
              />
              <Label
                htmlFor="import-analytics"
                className="text-sm font-normal opacity-50 cursor-not-allowed"
              >
                {t("common.import.analyticsSummary")}
                <span className="text-muted-foreground ml-2 text-xs">
                  {t("common.import.readOnlyCannotImport")}
                </span>
              </Label>
            </div>
          </div>

          {!importOptions.categories &&
            !importOptions.products &&
            !importOptions.sellHistory &&
            file && (
              <p className="text-sm text-destructive">
                Please select at least one option to import.
              </p>
            )}

          {importStatus && (
            <div className="p-3 rounded-md border space-y-2">
              <div className="text-sm">
                <span className="text-green-400 font-semibold">
                  {t("common.import.success")}: {importStatus.success}
                </span>
                {importStatus.failed > 0 && (
                  <span className="text-red-400 font-semibold ml-4">
                    {t("common.import.failed")}: {importStatus.failed}
                  </span>
                )}
              </div>
              {importStatus.errors.length > 0 && (
                <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
                  {importStatus.errors.map((error, idx) => (
                    <div key={idx}>{error}</div>
                  ))}
                  {importStatus.errors.length === 10 && (
                    <div>{t("common.import.andMoreErrors")}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              setFile(null);
              setImportStatus(null);
              setAvailableSheets([]);
              setImportOptions({
                categories: false,
                products: true,
                sellHistory: false,
                analytics: false,
              });
            }}
            disabled={isProcessing}
          >
            {t("common.buttons.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={
              !file ||
              isProcessing ||
              (!importOptions.categories &&
                !importOptions.products &&
                !importOptions.sellHistory)
            }
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.import.importing")}
              </>
            ) : (
              t("common.import.import")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
