"use client";

import { useEffect } from "react";
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
import { useImportStore } from "@/lib/stores";
import {
  detectAvailableSheets,
  getDefaultImportOptions,
  processImport,
} from "@/lib/services/import-service";
import { useCreateProduct } from "@/lib/hooks/use-products";
import { useCreateCategory } from "@/lib/hooks/use-categories";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { useDialog } from "@/lib/hooks/use-dialog";
import { useAlert } from "@/lib/hooks/use-alert";

export function ImportButton() {
  const { t } = useTranslation();
  const dialog = useDialog("import");
  const { showAlert, AlertComponent } = useAlert();

  // Import store state and actions
  const file = useImportStore((state) => state.file);
  const isProcessing = useImportStore((state) => state.isProcessing);
  const availableSheets = useImportStore((state) => state.availableSheets);
  const importOptions = useImportStore((state) => state.importOptions);
  const importStatus = useImportStore((state) => state.importStatus);

  const setFile = useImportStore((state) => state.setFile);
  const setProcessing = useImportStore((state) => state.setProcessing);
  const setAvailableSheets = useImportStore(
    (state) => state.setAvailableSheets
  );
  const updateImportOptions = useImportStore(
    (state) => state.updateImportOptions
  );
  const setImportOptions = useImportStore((state) => state.setImportOptions);
  const setImportStatus = useImportStore((state) => state.setImportStatus);
  const resetImportState = useImportStore((state) => state.resetImportState);

  const createProduct = useCreateProduct();
  const createCategory = useCreateCategory();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      if (ext !== "xlsx" && ext !== "xls") {
        await showAlert(t("common.import.selectExcelFile"));
        return;
      }
      setFile(selectedFile);
      setImportStatus(null);
      setAvailableSheets([]); // Reset first

      // Detect available sheets using service
      try {
        const sheets = await detectAvailableSheets(selectedFile);
        setAvailableSheets(sheets);

        // Auto-select options based on available sheets using service
        const defaultOptions = getDefaultImportOptions(sheets);
        setImportOptions(defaultOptions);
      } catch (error) {
        console.error("Error reading file:", error);
        // Even if sheet detection fails, allow import from first sheet
        setAvailableSheets(["Products"]); // Default assumption
        setImportOptions(getDefaultImportOptions(["Products"]));
      }
    } else {
      setFile(null);
      setAvailableSheets([]);
      setImportOptions(getDefaultImportOptions([]));
    }
  };

  const handleImport = async () => {
    if (!file) {
      await showAlert(t("common.import.selectFileSimple"));
      return;
    }

    setProcessing(true);
    setImportStatus(null);

    try {
      const result = await processImport(
        file,
        importOptions,
        availableSheets,
        (data) => createCategory.mutateAsync(data),
        (data) => createProduct.mutateAsync(data),
        t
      );

      setImportStatus(result);

      if (result.success > 0) {
        // Reset form after successful import
        setTimeout(() => {
          resetImportState();
          dialog.close();
        }, 3000);
      }
    } catch (error) {
      console.error("Import error:", error);
      await showAlert(t("common.import.importFailed"));
    } finally {
      setProcessing(false);
    }
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!dialog.isOpen) {
      resetImportState();
    }
  }, [dialog.isOpen, resetImportState]);

  return (
    <Dialog
      open={dialog.isOpen}
      onOpenChange={(open) => (open ? dialog.open() : dialog.close())}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t("common.import.importExcel")}
          </span>
          <span className="sm:hidden">{t("common.import.import")}</span>
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
            <Label htmlFor="file-upload">{t("common.import.excelFile")}</Label>
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
                  updateImportOptions({
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
                {t("common.import.categories")}
                {file &&
                  availableSheets.length > 0 &&
                  !availableSheets.includes("Categories") && (
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
                  updateImportOptions({
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
                  updateImportOptions({
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
                {t("common.import.sellHistory")}
                {file &&
                  availableSheets.length > 0 &&
                  !availableSheets.includes("Sell History") && (
                    <span className="text-muted-foreground ml-2">
                      {t("common.import.sheetNotFound")}
                    </span>
                  )}
                {file && availableSheets.includes("Sell History") && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    {t("common.import.requiresProducts")}
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
                {t("common.import.noDataSelected")}
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
              dialog.close();
              resetImportState();
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
    <>
      <AlertComponent />
    </>
  );
}
