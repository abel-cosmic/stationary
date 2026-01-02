"use client";

import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, DollarSign } from "lucide-react";
import type { Debit } from "@/types/api";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface DebitTableProps {
  debits: Debit[];
  onEdit?: (debit: Debit) => void;
  onDelete?: (debit: Debit) => void;
  onPay?: (debit: Debit) => void;
}

export function DebitTable({
  debits,
  onEdit,
  onDelete,
  onPay,
}: DebitTableProps) {
  const { t } = useTranslation();

  const getStatusBadge = (status: Debit["status"]) => {
    const variants = {
      PENDING: "destructive",
      PARTIAL: "default",
      PAID: "default",
    } as const;

    const colors = {
      PENDING:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      PARTIAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };

    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
          colors[status]
        )}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              {t("common.debits.customerName") || "Customer"}
            </TableHead>
            <TableHead>
              {t("common.debits.totalAmount") || "Total Amount"}
            </TableHead>
            <TableHead>
              {t("common.debits.paidAmount") || "Paid Amount"}
            </TableHead>
            <TableHead>{t("common.debits.remaining") || "Remaining"}</TableHead>
            <TableHead>{t("common.debits.status") || "Status"}</TableHead>
            <TableHead>{t("common.debits.date") || "Date"}</TableHead>
            <TableHead className="w-[150px]">
              {t("common.debits.actions") || "Actions"}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {debits.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-muted-foreground"
              >
                {t("common.debits.noDebits") || "No debits found"}
              </TableCell>
            </TableRow>
          ) : (
            debits.map((debit) => {
              const remaining = debit.totalAmount - debit.paidAmount;
              return (
                <TableRow key={debit.id}>
                  <TableCell>
                    {debit.customerName || (
                      <span className="text-muted-foreground">
                        {t("common.debits.noCustomer") || "No customer"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {debit.totalAmount.toFixed(2)} ETB
                  </TableCell>
                  <TableCell>{debit.paidAmount.toFixed(2)} ETB</TableCell>
                  <TableCell
                    className={cn(
                      remaining > 0 && "font-semibold text-destructive"
                    )}
                  >
                    {remaining.toFixed(2)} ETB
                  </TableCell>
                  <TableCell>{getStatusBadge(debit.status)}</TableCell>
                  <TableCell>
                    {format(new Date(debit.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {debit.status !== "PAID" && onPay && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onPay(debit)}
                          title={
                            t("common.debits.recordPayment") || "Record Payment"
                          }
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onEdit(debit)}
                          title={t("common.buttons.edit") || "Edit"}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => onDelete(debit)}
                          title={t("common.buttons.delete") || "Delete"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
