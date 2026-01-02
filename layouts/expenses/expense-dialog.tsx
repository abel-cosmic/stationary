"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useCreateSupplyExpense,
  useUpdateSupplyExpense,
  useCreateDailyExpense,
  useUpdateDailyExpense,
} from "@/lib/hooks/use-expenses";
import type { SupplyExpense, DailyExpense } from "@/types/api";

const createSupplyExpenseSchema = (t: (key: string) => string) =>
  z.object({
    description: z
      .string()
      .min(
        1,
        t("common.expenses.descriptionRequired") || "Description is required"
      ),
    amount: z.coerce
      .number()
      .positive(
        t("common.expenses.amountRequired") || "Amount must be positive"
      ),
    supplier: z.string().optional(),
    quantity: z.coerce.number().int().positive().optional().nullable(),
    unitPrice: z.coerce.number().positive().optional().nullable(),
    notes: z.string().optional(),
  });

const createDailyExpenseSchema = (t: (key: string) => string) =>
  z.object({
    description: z
      .string()
      .min(
        1,
        t("common.expenses.descriptionRequired") || "Description is required"
      ),
    amount: z.coerce
      .number()
      .positive(
        t("common.expenses.amountRequired") || "Amount must be positive"
      ),
    category: z.string().optional(),
    notes: z.string().optional(),
    expenseDate: z.string().optional(),
  });

type SupplyExpenseFormValues = {
  description: string;
  amount: number;
  supplier?: string;
  quantity?: number | null;
  unitPrice?: number | null;
  notes?: string;
};

type DailyExpenseFormValues = {
  description: string;
  amount: number;
  category?: string;
  notes?: string;
  expenseDate?: string;
};

interface ExpenseDialogProps {
  type: "supply" | "daily";
  expense?: SupplyExpense | DailyExpense;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function ExpenseDialog({
  type,
  expense,
  trigger,
  onSuccess,
}: ExpenseDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const createSupplyExpense = useCreateSupplyExpense();
  const updateSupplyExpense = useUpdateSupplyExpense();
  const createDailyExpense = useCreateDailyExpense();
  const updateDailyExpense = useUpdateDailyExpense();

  const supplySchema = useMemo(() => createSupplyExpenseSchema(t), [t]);
  const dailySchema = useMemo(() => createDailyExpenseSchema(t), [t]);

  const supplyForm = useForm<SupplyExpenseFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(supplySchema) as any,
    defaultValues: {
      description: (expense as SupplyExpense)?.description || "",
      amount: expense?.amount || 0,
      supplier: (expense as SupplyExpense)?.supplier || "",
      quantity: (expense as SupplyExpense)?.quantity || null,
      unitPrice: (expense as SupplyExpense)?.unitPrice || null,
      notes: expense?.notes || "",
    },
  });

  const dailyForm = useForm<DailyExpenseFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(dailySchema) as any,
    defaultValues: {
      description: expense?.description || "",
      amount: expense?.amount || 0,
      category: (expense as DailyExpense)?.category || "",
      notes: expense?.notes || "",
      expenseDate: (expense as DailyExpense)?.expenseDate
        ? new Date((expense as DailyExpense).expenseDate)
            .toISOString()
            .split("T")[0]
        : new Date().toISOString().split("T")[0],
    },
  });

  const form = type === "supply" ? supplyForm : dailyForm;

  useEffect(() => {
    if (open && expense) {
      if (type === "supply") {
        const supplyExpense = expense as SupplyExpense;
        supplyForm.reset({
          description: supplyExpense.description || "",
          amount: supplyExpense.amount || 0,
          supplier: supplyExpense.supplier || "",
          quantity: supplyExpense.quantity || null,
          unitPrice: supplyExpense.unitPrice || null,
          notes: supplyExpense.notes || "",
        });
      } else {
        const dailyExpense = expense as DailyExpense;
        dailyForm.reset({
          description: dailyExpense.description || "",
          amount: dailyExpense.amount || 0,
          category: dailyExpense.category || "",
          notes: dailyExpense.notes || "",
          expenseDate: dailyExpense.expenseDate
            ? new Date(dailyExpense.expenseDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        });
      }
    } else if (open && !expense) {
      if (type === "supply") {
        supplyForm.reset({
          description: "",
          amount: 0,
          supplier: "",
          quantity: null,
          unitPrice: null,
          notes: "",
        });
      } else {
        dailyForm.reset({
          description: "",
          amount: 0,
          category: "",
          notes: "",
          expenseDate: new Date().toISOString().split("T")[0],
        });
      }
    }
  }, [open, expense, type, supplyForm, dailyForm]);

  const onSubmit = async (
    data: SupplyExpenseFormValues | DailyExpenseFormValues
  ) => {
    try {
      if (type === "supply") {
        if (expense) {
          await updateSupplyExpense.mutateAsync({
            id: expense.id,
            data: data as SupplyExpenseFormValues,
          });
        } else {
          await createSupplyExpense.mutateAsync(
            data as SupplyExpenseFormValues
          );
        }
      } else {
        if (expense) {
          await updateDailyExpense.mutateAsync({
            id: expense.id,
            data: data as DailyExpenseFormValues,
          });
        } else {
          await createDailyExpense.mutateAsync(data as DailyExpenseFormValues);
        }
      }
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving expense:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("common.expenses.createExpense") || "Create Expense"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {expense
              ? t("common.expenses.editExpense") || "Edit Expense"
              : type === "supply"
              ? t("common.expenses.createSupplyExpense") ||
                "Create Supply Expense"
              : t("common.expenses.createDailyExpense") ||
                "Create Daily Expense"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {expense
              ? t("common.expenses.editExpenseDescription") ||
                "Update expense information"
              : type === "supply"
              ? t("common.expenses.createSupplyExpenseDescription") ||
                "Record a supply purchase expense"
              : t("common.expenses.createDailyExpenseDescription") ||
                "Record a daily operational expense"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.expenses.descriptionLabel") || "Description"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-11 sm:h-10 text-base sm:text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.expenses.amount") || "Amount"} (ETB)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0.01"
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value || ""}
                        className="h-11 sm:h-10 text-base sm:text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {type === "supply" && (
                <>
                  <FormField
                    control={supplyForm.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          {t("common.expenses.supplier") || "Supplier"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-11 sm:h-10 text-base sm:text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={supplyForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {t("common.expenses.quantity") || "Quantity"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : null
                                )
                              }
                              value={field.value || ""}
                              className="h-11 sm:h-10 text-base sm:text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={supplyForm.control}
                      name="unitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {t("common.expenses.unitPrice") || "Unit Price"}{" "}
                            (ETB)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              min="0.01"
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : null
                                )
                              }
                              value={field.value || ""}
                              className="h-11 sm:h-10 text-base sm:text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {type === "daily" && (
                <>
                  <FormField
                    control={dailyForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          {t("common.expenses.category") || "Category"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={
                              t("common.expenses.categoryPlaceholder") ||
                              "e.g., Utilities, Rent"
                            }
                            className="h-11 sm:h-10 text-base sm:text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={dailyForm.control}
                    name="expenseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          {t("common.expenses.expenseDate") || "Expense Date"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            className="h-11 sm:h-10 text-base sm:text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.expenses.notes") || "Notes"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={
                          t("common.expenses.notesPlaceholder") ||
                          "Optional notes"
                        }
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm"
              >
                {t("common.buttons.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  createSupplyExpense.isPending ||
                  updateSupplyExpense.isPending ||
                  createDailyExpense.isPending ||
                  updateDailyExpense.isPending
                }
                className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm"
              >
                {(createSupplyExpense.isPending ||
                  updateSupplyExpense.isPending ||
                  createDailyExpense.isPending ||
                  updateDailyExpense.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("common.buttons.save") || "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
