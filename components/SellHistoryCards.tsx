"use client";

import { SellHistory } from "@/lib/api";
import { format } from "date-fns";
import { Calendar, Package, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SellHistoryCardsProps {
  history: SellHistory[];
}

export function SellHistoryCards({ history }: SellHistoryCardsProps) {
  const { t } = useTranslation();

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("common.sellHistory.noHistory")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <div
          key={item.id}
          className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold">
              {format(new Date(item.createdAt), "MMM dd, yyyy")}
            </h3>
            <span className="text-xs text-muted-foreground ml-auto">
              {format(new Date(item.createdAt), "HH:mm")}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Package className="h-4 w-4" />
                {t("common.sellHistory.quantity")}
              </span>
              <span className="font-semibold">{item.amount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {t("common.sellHistory.pricePerUnitLabel")}
              </span>
              <span className="font-semibold">
                {item.soldPrice.toFixed(2)} ETB
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                {t("common.analytics.totalRevenueLabel")}
              </span>
              <span className="font-bold text-lg text-primary">
                {item.totalPrice.toFixed(2)} ETB
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
