"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SellHistory } from "@/lib/api";
import { format } from "date-fns";

interface SellHistoryTableProps {
  history: SellHistory[];
}

export function SellHistoryTable({ history }: SellHistoryTableProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No sell history available for this product.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[140px]">Date</TableHead>
            <TableHead className="hidden sm:table-cell">Quantity Sold</TableHead>
            <TableHead className="hidden md:table-cell">Price per Unit</TableHead>
            <TableHead className="min-w-[120px]">Total Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span>{format(new Date(item.createdAt), "MMM dd, yyyy")}</span>
                  <span className="text-xs text-muted-foreground sm:hidden">
                    Qty: {item.amount} | Price: {item.soldPrice.toFixed(2)} ETB
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">{item.amount}</TableCell>
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
