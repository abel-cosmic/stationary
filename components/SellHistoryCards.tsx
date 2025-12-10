"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SellHistory } from "@/lib/api";
import { format } from "date-fns";
import { Calendar, Package, DollarSign } from "lucide-react";

interface SellHistoryCardsProps {
  history: SellHistory[];
}

export function SellHistoryCards({ history }: SellHistoryCardsProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No sell history available for this product.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {history.map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {format(new Date(item.createdAt), "MMM dd, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Package className="h-4 w-4" />
                Quantity:
              </span>
              <span className="font-semibold">{item.amount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Price per Unit:
              </span>
              <span className="font-semibold">
                {item.soldPrice.toFixed(2)} ETB
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Total Revenue:</span>
              <span className="font-bold text-lg text-primary">
                {item.totalPrice.toFixed(2)} ETB
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(item.createdAt), "HH:mm")}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

