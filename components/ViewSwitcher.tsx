"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export type ViewMode = "card" | "table";

interface ViewSwitcherProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewSwitcher({ view, onViewChange }: ViewSwitcherProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
      <Button
        variant={view === "card" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("card")}
        className={cn(
          "h-10 w-10 sm:h-9 sm:w-auto sm:px-3 touch-manipulation text-black dark:text-white",
          view === "card" ? "bg-background shadow-sm" : ""
        )}
        aria-label={t("common.view.cardView")}
      >
        <LayoutGrid className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
        <span className="hidden sm:inline">{t("common.view.card")}</span>
      </Button>
      <Button
        variant={view === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
        className={cn(
          "h-10 w-10 sm:h-9 sm:w-auto sm:px-3 touch-manipulation text-black dark:text-white",
          view === "table" ? "bg-background shadow-sm" : ""
        )}
        aria-label={t("common.view.tableView")}
      >
        <Table2 className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
        <span className="hidden sm:inline">{t("common.view.table")}</span>
      </Button>
    </div>
  );
}
