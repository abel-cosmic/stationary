"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "card" | "table";

interface ViewSwitcherProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewSwitcher({ view, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
      <Button
        variant={view === "card" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("card")}
        className={cn(
          "h-8 px-2 sm:px-3",
          view === "card" ? "bg-background shadow-sm" : ""
        )}
        aria-label="Card view"
      >
        <LayoutGrid className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Card</span>
      </Button>
      <Button
        variant={view === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
        className={cn(
          "h-8 px-2 sm:px-3",
          view === "table" ? "bg-background shadow-sm" : ""
        )}
        aria-label="Table view"
      >
        <Table2 className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Table</span>
      </Button>
    </div>
  );
}

