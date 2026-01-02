"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExpenseTable } from "@/layouts/expenses/expense-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useSupplyExpenses,
  useCreateSupplyExpense,
  useUpdateSupplyExpense,
  useDeleteSupplyExpense,
  useDailyExpenses,
  useCreateDailyExpense,
  useUpdateDailyExpense,
  useDeleteDailyExpense,
} from "@/lib/hooks/use-expenses";
import { Plus, ArrowLeft, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { ThemeToggle } from "@/layouts/common/theme-toggle";
import { LanguageToggle } from "@/layouts/common/language-toggle";
import type { SupplyExpense, DailyExpense } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const supplyExpenseSchema = (t: (key: string) => string) =>
  z.object({
    description: z.string().min(1, "Description is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    supplier: z.string().optional(),
    quantity: z.coerce.number().int().positive().optional().nullable(),
    unitPrice: z.coerce.number().positive().optional().nullable(),
    notes: z.string().optional(),
  });

const dailyExpenseSchema = (t: (key: string) => string) =>
  z.object({
    description: z.string().min(1, "Description is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    category: z.string().optional(),
    notes: z.string().optional(),
    expenseDate: z.string().optional(),
  });

export default function ExpensesPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"supply" | "daily">("supply");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<
    SupplyExpense | DailyExpense | null
  >(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<
    SupplyExpense | DailyExpense | null
  >(null);

  const { data: supplyExpenses, isLoading: supplyLoading } =
    useSupplyExpenses();
  const { data: dailyExpenses, isLoading: dailyLoading } = useDailyExpenses();

  const createSupplyExpense = useCreateSupplyExpense();
  const updateSupplyExpense = useUpdateSupplyExpense();
  const deleteSupplyExpense = useDeleteSupplyExpense();

  const createDailyExpense = useCreateDailyExpense();
  const updateDailyExpense = useUpdateDailyExpense();
  const deleteDailyExpense = useDeleteDailyExpense();

  const supplySchema = supplyExpenseSchema(t);
  const dailySchema = dailyExpenseSchema(t);

  type SupplyExpenseFormValues = z.infer<typeof supplySchema>;
  type DailyExpenseFormValues = z.infer<typeof dailySchema>;

  const supplyForm = useForm({
    resolver: zodResolver(supplySchema),
    defaultValues: {
      description: "",
      amount: 0,
      supplier: "",
      quantity: null,
      unitPrice: null,
      notes: "",
    },
  });

  const dailyForm = useForm({
    resolver: zodResolver(dailySchema),
    defaultValues: {
      description: "",
      amount: 0,
      category: "",
      notes: "",
      expenseDate: new Date().toISOString().split("T")[0],
    },
  });

  const form = activeTab === "supply" ? supplyForm : dailyForm;

  const handleCreate = () => {
    setEditingExpense(null);
    setDialogOpen(true);
    if (activeTab === "supply") {
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
  };

  const handleEdit = (expense: SupplyExpense | DailyExpense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
    if (activeTab === "supply") {
      const se = expense as SupplyExpense;
      supplyForm.reset({
        description: se.description,
        amount: se.amount,
        supplier: se.supplier || "",
        quantity: se.quantity || null,
        unitPrice: se.unitPrice || null,
        notes: se.notes || "",
      });
    } else {
      const de = expense as DailyExpense;
      dailyForm.reset({
        description: de.description,
        amount: de.amount,
        category: de.category || "",
        notes: de.notes || "",
        expenseDate: de.expenseDate
          ? new Date(de.expenseDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    }
  };

  const handleDelete = (expense: SupplyExpense | DailyExpense) => {
    setExpenseToDelete(expense);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = async (
    data: SupplyExpenseFormValues | DailyExpenseFormValues
  ) => {
    try {
      if (activeTab === "supply") {
        if (editingExpense) {
          await updateSupplyExpense.mutateAsync({
            id: editingExpense.id,
            data,
          });
        } else {
          await createSupplyExpense.mutateAsync(data);
        }
      } else {
        if (editingExpense) {
          await updateDailyExpense.mutateAsync({
            id: editingExpense.id,
            data,
          });
        } else {
          await createDailyExpense.mutateAsync(data);
        }
      }
      setDialogOpen(false);
      setEditingExpense(null);
    } catch (error) {
      console.error("Error saving expense:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (expenseToDelete) {
      try {
        if (activeTab === "supply") {
          await deleteSupplyExpense.mutateAsync(expenseToDelete.id);
        } else {
          await deleteDailyExpense.mutateAsync(expenseToDelete.id);
        }
        setExpenseToDelete(null);
      } catch (error) {
        console.error("Error deleting expense:", error);
      }
    }
  };

  const totalSupply =
    supplyExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const totalDaily = dailyExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8 flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <Receipt className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold">
                  {t("common.expenses.title") || "Expenses Management"}
                </h1>
              </div>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                {t("common.expenses.description") ||
                  "Track supply purchases and daily operational expenses"}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t("common.backToHome")}
                  </span>
                  <span className="sm:hidden">{t("common.back")}</span>
                </Button>
              </Link>
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              {t("common.expenses.totalSupplyExpenses") ||
                "Total Supply Expenses"}
            </p>
            <p className="text-2xl font-bold">{totalSupply.toFixed(2)} ETB</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              {t("common.expenses.totalDailyExpenses") ||
                "Total Daily Expenses"}
            </p>
            <p className="text-2xl font-bold">{totalDaily.toFixed(2)} ETB</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-md mb-4">
          <Button
            variant={activeTab === "supply" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("supply")}
            className="flex-1"
          >
            {t("common.expenses.supplyExpenses") || "Supply Expenses"}
          </Button>
          <Button
            variant={activeTab === "daily" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("daily")}
            className="flex-1"
          >
            {t("common.expenses.dailyExpenses") || "Daily Expenses"}
          </Button>
        </div>

        {/* Actions */}
        <div className="mb-4">
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("common.expenses.createExpense") || "Create Expense"}
          </Button>
        </div>

        {/* Expenses Table */}
        {activeTab === "supply" ? (
          supplyLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("common.loading") || "Loading..."}
            </div>
          ) : (
            <ExpenseTable
              expenses={supplyExpenses || []}
              type="supply"
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )
        ) : dailyLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("common.loading") || "Loading..."}
          </div>
        ) : (
          <ExpenseTable
            expenses={dailyExpenses || []}
            type="daily"
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExpense
                  ? t("common.expenses.editExpense") || "Edit Expense"
                  : activeTab === "supply"
                  ? t("common.expenses.createSupplyExpense") ||
                    "Create Supply Expense"
                  : t("common.expenses.createDailyExpense") ||
                    "Create Daily Expense"}
              </DialogTitle>
              <DialogDescription>
                {editingExpense
                  ? t("common.expenses.editExpenseDescription") ||
                    "Update expense information"
                  : activeTab === "supply"
                  ? t("common.expenses.createSupplyExpenseDescription") ||
                    "Record a supply purchase expense"
                  : t("common.expenses.createDailyExpenseDescription") ||
                    "Record a daily operational expense"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("common.expenses.descriptionLabel") || "Description"}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>
                        {t("common.expenses.amount") || "Amount"} (ETB)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0.01"
                          onChange={(e) => field.onChange(e.target.value)}
                          value={field.value != null ? String(field.value) : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {activeTab === "supply" && (
                  <>
                    <FormField
                      control={supplyForm.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("common.expenses.supplier") || "Supplier"}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <FormLabel>
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
                                value={
                                  field.value != null ? String(field.value) : ""
                                }
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
                            <FormLabel>
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
                                value={
                                  field.value != null ? String(field.value) : ""
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {activeTab === "daily" && (
                  <>
                    <FormField
                      control={dailyForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("common.expenses.category") || "Category"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={
                                t("common.expenses.categoryPlaceholder") ||
                                "e.g., Utilities, Rent"
                              }
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
                          <FormLabel>
                            {t("common.expenses.expenseDate") || "Expense Date"}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
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
                      <FormLabel>
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

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
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

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title={t("common.expenses.deleteExpense") || "Delete Expense"}
          message={
            t("common.expenses.deleteExpenseConfirm") ||
            "Are you sure you want to delete this expense? This action cannot be undone."
          }
          variant="destructive"
          confirmLabel={t("common.buttons.delete") || "Delete"}
          cancelLabel={t("common.buttons.cancel") || "Cancel"}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setExpenseToDelete(null);
          }}
        />
      </div>
    </div>
  );
}
