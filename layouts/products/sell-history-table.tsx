"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SellHistory } from "@/types/api";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

interface SellHistoryTableProps {
  history: SellHistory[];
}

export function SellHistoryTable({ history }: SellHistoryTableProps) {
  const { t } = useTranslation();

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("common.sellHistory.noHistory")}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[140px]">
              {t("common.sellHistory.date")}
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              {t("common.sellHistory.quantitySold")}
            </TableHead>
            <TableHead className="hidden md:table-cell">
              {t("common.sellHistory.pricePerUnit")}
            </TableHead>
            <TableHead className="min-w-[120px]">
              {t("common.sellHistory.totalRevenue")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span>
                    {format(new Date(item.createdAt), "MMM dd, yyyy")}
                  </span>
                  <span className="text-xs text-muted-foreground sm:hidden">
                    {t("common.table.qty")}: {item.amount} |{" "}
                    {t("common.table.price")}: {item.soldPrice.toFixed(2)} ETB
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {item.amount}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {item.soldPrice.toFixed(2)} ETB
              </TableCell>
              <TableCell className="font-semibold">
                {item.totalPrice.toFixed(2)} ETB
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
