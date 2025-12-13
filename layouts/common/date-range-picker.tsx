"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { CalendarIcon, X } from "lucide-react";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export type DateRange = {
  from: Date | undefined;
  to?: Date | undefined;
};

export type DatePreset =
  | "today"
  | "last7days"
  | "last30days"
  | "custom"
  | "all";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  preset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  preset,
  onPresetChange,
  className,
}: DateRangePickerProps) {
  const { t } = useTranslation();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handlePresetChange = (newPreset: DatePreset) => {
    onPresetChange(newPreset);
    const now = new Date();
    const today = startOfDay(now);

    switch (newPreset) {
      case "today":
        onChange({
          from: today,
          to: endOfDay(now),
        });
        break;
      case "last7days":
        onChange({
          from: startOfDay(subDays(now, 6)),
          to: endOfDay(now),
        });
        break;
      case "last30days":
        onChange({
          from: startOfDay(subDays(now, 29)),
          to: endOfDay(now),
        });
        break;
      case "all":
        onChange({
          from: undefined,
          to: undefined,
        });
        break;
      case "custom":
        // Keep current range when switching to custom
        break;
    }
  };

  const formatDateRange = () => {
    if (!value.from && !value.to) {
      return t("common.dateRange.allTime");
    }
    if (value.from && value.to) {
      if (format(value.from, "yyyy-MM-dd") === format(value.to, "yyyy-MM-dd")) {
        return format(value.from, "MMM dd, yyyy");
      }
      return `${format(value.from, "MMM dd")} - ${format(
        value.to,
        "MMM dd, yyyy"
      )}`;
    }
    if (value.from) {
      return `${t("common.dateRange.from")} ${format(
        value.from,
        "MMM dd, yyyy"
      )}`;
    }
    if (value.to) {
      return `${t("common.dateRange.until")} ${format(
        value.to,
        "MMM dd, yyyy"
      )}`;
    }
    return t("common.dateRange.selectDateRange");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <Label className="text-sm font-medium whitespace-nowrap">
          {t("common.dateRange.dateRange")}
        </Label>
        <Select value={preset} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.dateRange.allTime")}</SelectItem>
            <SelectItem value="today">{t("common.dateRange.today")}</SelectItem>
            <SelectItem value="last7days">
              {t("common.dateRange.last7Days")}
            </SelectItem>
            <SelectItem value="last30days">
              {t("common.dateRange.last30Days")}
            </SelectItem>
            <SelectItem value="custom">
              {t("common.dateRange.customRange")}
            </SelectItem>
          </SelectContent>
        </Select>

        {preset === "custom" && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={cn(
                "w-full sm:w-[280px] justify-start text-left font-normal",
                !value.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
            {(value.from || value.to) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange({ from: undefined, to: undefined });
                }}
                className="h-9 w-9 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {preset === "custom" && isCalendarOpen && (
        <div className="border rounded-md p-3 bg-card">
          <Calendar
            mode="range"
            selected={value}
            onSelect={(range) => {
              if (range) {
                onChange(range);
                // Close calendar when both dates are selected
                if (range.from && range.to) {
                  setIsCalendarOpen(false);
                }
              }
            }}
            numberOfMonths={1}
            className="rounded-md"
          />
        </div>
      )}

      {preset !== "custom" && preset !== "all" && (
        <p className="text-xs text-muted-foreground">
          {t("common.dateRange.showing")} {formatDateRange()}
        </p>
      )}
    </div>
  );
}
