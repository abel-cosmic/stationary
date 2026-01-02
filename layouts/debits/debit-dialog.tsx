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
import { useCreateDebit, useUpdateDebit } from "@/lib/hooks/use-debits";
import { useSellHistory } from "@/lib/hooks/use-sell-history";
import type { Debit, SellHistory } from "@/types/api";
import { Loader2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

const createDebitSchema = (t: (key: string) => string) =>
  z.object({
    customerName: z.string().optional(),
    notes: z.string().optional(),
    debitItems: z
      .array(
        z.object({
          sellHistoryId: z.number().int().positive(),
          amount: z.number().positive(),
        })
      )
      .min(
        1,
        t("common.debits.atLeastOneItem") || "At least one item is required"
      ),
  });

type DebitFormValues = {
  customerName?: string;
  notes?: string;
  debitItems: Array<{
    sellHistoryId: number;
    amount: number;
  }>;
};

interface DebitDialogProps {
  debit?: Debit;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function DebitDialog({ debit, trigger, onSuccess }: DebitDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const createDebit = useCreateDebit();
  const updateDebit = useUpdateDebit();
  const { data: sellHistory } = useSellHistory();

  const schema = useMemo(() => createDebitSchema(t), [t]);

  const form = useForm<DebitFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: debit?.customerName || "",
      notes: debit?.notes || "",
      debitItems:
        debit?.debitItems?.map((item) => ({
          sellHistoryId: item.sellHistoryId,
          amount: item.amount,
        })) || [],
    },
  });

  useEffect(() => {
    if (open && debit) {
      form.reset({
        customerName: debit.customerName || "",
        notes: debit.notes || "",
        debitItems:
          debit.debitItems?.map((item) => ({
            sellHistoryId: item.sellHistoryId,
            amount: item.amount,
          })) || [],
      });
    } else if (open && !debit) {
      form.reset({
        customerName: "",
        notes: "",
        debitItems: [],
      });
    }
  }, [open, debit, form]);

  const onSubmit = async (data: DebitFormValues) => {
    try {
      if (debit) {
        await updateDebit.mutateAsync({
          id: debit.id,
          data: {
            customerName: data.customerName || null,
            notes: data.notes || null,
          },
        });
      } else {
        await createDebit.mutateAsync({
          customerName: data.customerName || null,
          notes: data.notes || null,
          debitItems: data.debitItems,
        });
      }
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving debit:", error);
    }
  };

  const availableSellHistory = useMemo(() => {
    if (!sellHistory) return [];
    return sellHistory.filter((sh) => !sh.debitItem);
  }, [sellHistory]);

  const totalAmount = form
    .watch("debitItems")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("common.debits.createDebit") || "Create Debit"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {debit
              ? t("common.debits.editDebit") || "Edit Debit"
              : t("common.debits.createDebit") || "Create Debit"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {debit
              ? t("common.debits.editDebitDescription") ||
                "Update debit information"
              : t("common.debits.createDebitDescription") ||
                "Create a new debit record for unpaid sales"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              onSubmit as (data: DebitFormValues) => Promise<void>
            )}
          >
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.debits.customerName") || "Customer Name"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          t("common.debits.customerNamePlaceholder") ||
                          "Optional"
                        }
                        className="h-11 sm:h-10 text-base sm:text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!debit && (
                <div className="space-y-2">
                  <FormLabel className="text-sm font-medium">
                    {t("common.debits.selectSales") || "Select Sales"}
                  </FormLabel>
                  <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto space-y-2">
                    {availableSellHistory.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t("common.debits.noAvailableSales") ||
                          "No available sales to add to debit"}
                      </p>
                    ) : (
                      availableSellHistory.map((sh) => {
                        const item = form
                          .watch("debitItems")
                          .find((i) => i.sellHistoryId === sh.id);
                        const productName =
                          sh.product?.name || sh.service?.name || "Unknown";
                        return (
                          <div
                            key={sh.id}
                            className="flex items-center justify-between p-2 border rounded-md"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {productName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(sh.createdAt), "MMM dd, yyyy")}{" "}
                                - {sh.totalPrice.toFixed(2)} ETB
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max={sh.totalPrice}
                                value={item?.amount || 0}
                                onChange={(e) => {
                                  const amount =
                                    parseFloat(e.target.value) || 0;
                                  const currentItems =
                                    form.getValues("debitItems");
                                  const existingIndex = currentItems.findIndex(
                                    (i) => i.sellHistoryId === sh.id
                                  );

                                  if (amount > 0) {
                                    if (existingIndex >= 0) {
                                      currentItems[existingIndex].amount =
                                        Math.min(amount, sh.totalPrice);
                                    } else {
                                      currentItems.push({
                                        sellHistoryId: sh.id,
                                        amount: Math.min(amount, sh.totalPrice),
                                      });
                                    }
                                  } else {
                                    if (existingIndex >= 0) {
                                      currentItems.splice(existingIndex, 1);
                                    }
                                  }

                                  form.setValue("debitItems", currentItems);
                                }}
                                className="w-24 h-9"
                                placeholder="0.00"
                              />
                              <span className="text-xs text-muted-foreground">
                                / {sh.totalPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              <div className="p-3 bg-muted rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {t("common.debits.totalAmount") || "Total Amount"}:
                  </span>
                  <span className="text-lg font-semibold">
                    {totalAmount.toFixed(2)} ETB
                  </span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.debits.notes") || "Notes"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={
                          t("common.debits.notesPlaceholder") ||
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
                  createDebit.isPending ||
                  updateDebit.isPending ||
                  (!debit && form.watch("debitItems").length === 0)
                }
                className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm"
              >
                {(createDebit.isPending || updateDebit.isPending) && (
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
