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
import { Edit, Trash2 } from "lucide-react";
import type { SupplyExpense, DailyExpense } from "@/types/api";
import { useTranslation } from "react-i18next";

interface ExpenseTableProps {
  expenses: (SupplyExpense | DailyExpense)[];
  type: "supply" | "daily";
  onEdit?: (expense: SupplyExpense | DailyExpense) => void;
  onDelete?: (expense: SupplyExpense | DailyExpense) => void;
}

export function ExpenseTable({
  expenses,
  type,
  onEdit,
  onDelete,
}: ExpenseTableProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              {t("common.expenses.descriptionLabel") || "Description"}
            </TableHead>
            <TableHead>{t("common.expenses.amount") || "Amount"}</TableHead>
            {type === "supply" ? (
              <>
                <TableHead>
                  {t("common.expenses.supplier") || "Supplier"}
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  {t("common.expenses.quantity") || "Quantity"}
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  {t("common.expenses.unitPrice") || "Unit Price"}
                </TableHead>
              </>
            ) : (
              <TableHead>
                {t("common.expenses.category") || "Category"}
              </TableHead>
            )}
            <TableHead>{t("common.expenses.date") || "Date"}</TableHead>
            <TableHead className="w-[100px]">
              {t("common.expenses.actions") || "Actions"}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={type === "supply" ? 7 : 5}
                className="text-center py-8 text-muted-foreground"
              >
                {t("common.expenses.noExpenses") || "No expenses found"}
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => {
              const date =
                type === "supply"
                  ? expense.createdAt
                  : (expense as DailyExpense).expenseDate;
              return (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">
                    {expense.description}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {expense.amount.toFixed(2)} ETB
                  </TableCell>
                  {type === "supply" ? (
                    <>
                      <TableCell>
                        {(expense as SupplyExpense).supplier || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {(expense as SupplyExpense).quantity || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {(() => {
                          const unitPrice = (expense as SupplyExpense)
                            .unitPrice;
                          return unitPrice
                            ? `${unitPrice.toFixed(2)} ETB`
                            : "-";
                        })()}
                      </TableCell>
                    </>
                  ) : (
                    <TableCell>
                      {(expense as DailyExpense).category || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    {format(new Date(date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onEdit(expense)}
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
                          onClick={() => onDelete(expense)}
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
