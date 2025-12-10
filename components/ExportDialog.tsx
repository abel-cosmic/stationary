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
import { Download, Loader2 } from "lucide-react";
import { Product } from "@/lib/api";
import { exportToExcel } from "@/lib/excel-utils";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ExportDialogProps {
  products: Product[];
}

export function ExportDialog({ products }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    products: true,
    sellHistory: true,
    analytics: true,
  });

  const handleExport = () => {
    if (products.length === 0) {
      alert("No products to export");
      return;
    }

    setIsExporting(true);
    try {
      exportToExcel(products, exportOptions);
      setOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={products.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export Excel</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export to Excel</DialogTitle>
          <DialogDescription>
            Select what data you want to export to Excel file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Options</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-products"
                checked={exportOptions.products}
                onCheckedChange={(checked) =>
                  setExportOptions({ ...exportOptions, products: checked === true })
                }
              />
              <Label
                htmlFor="export-products"
                className="text-sm font-normal cursor-pointer"
              >
                Product List
                <span className="text-muted-foreground ml-2">
                  ({products.length} products)
                </span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-history"
                checked={exportOptions.sellHistory}
                onCheckedChange={(checked) =>
                  setExportOptions({ ...exportOptions, sellHistory: checked === true })
                }
              />
              <Label
                htmlFor="export-history"
                className="text-sm font-normal cursor-pointer"
              >
                Sell History
                <span className="text-muted-foreground ml-2">
                  ({products.reduce((sum, p) => sum + (p.sellHistory?.length || 0), 0)} records)
                </span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-analytics"
                checked={exportOptions.analytics}
                onCheckedChange={(checked) =>
                  setExportOptions({ ...exportOptions, analytics: checked === true })
                }
              />
              <Label
                htmlFor="export-analytics"
                className="text-sm font-normal cursor-pointer"
              >
                Analytics Summary
                <span className="text-muted-foreground ml-2">
                  (Total profit, daily/weekly stats)
                </span>
              </Label>
            </div>
          </div>

          {!exportOptions.products && !exportOptions.sellHistory && !exportOptions.analytics && (
            <p className="text-sm text-destructive">
              Please select at least one option to export.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={
              isExporting ||
              (!exportOptions.products && !exportOptions.sellHistory && !exportOptions.analytics)
            }
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

