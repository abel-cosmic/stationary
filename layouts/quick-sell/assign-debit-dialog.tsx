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
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateDebit } from "@/lib/hooks/use-debits";
import type { SellHistory } from "@/types/api";
import { Loader2, CreditCard } from "lucide-react";
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

interface AssignDebitDialogProps {
  sellHistory: SellHistory | SellHistory[];
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function AssignDebitDialog({
  sellHistory,
  trigger,
  onSuccess,
}: AssignDebitDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const createDebit = useCreateDebit();

  const sellHistoryArray = useMemo(
    () => (Array.isArray(sellHistory) ? sellHistory : [sellHistory]),
    [sellHistory]
  );

  const schema = useMemo(() => createDebitSchema(t), [t]);

  const defaultDebitItems = useMemo(
    () =>
      sellHistoryArray.map((sh) => ({
        sellHistoryId: sh.id,
        amount: sh.totalPrice,
      })),
    [sellHistoryArray]
  );

  const form = useForm<DebitFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: "",
      notes: "",
      debitItems: defaultDebitItems,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        customerName: "",
        notes: "",
        debitItems: defaultDebitItems,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDebitItems]);

  const onSubmit = async (data: DebitFormValues) => {
    try {
      await createDebit.mutateAsync({
        customerName: data.customerName || null,
        notes: data.notes || null,
        debitItems: data.debitItems,
      });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating debit:", error);
    }
  };

  const totalAmount = form
    .watch("debitItems")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <CreditCard className="mr-2 h-4 w-4" />
            {t("common.quickSell.assignToDebit") || "Assign to Debit"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {t("common.quickSell.assignToDebit") || "Assign to Debit"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t("common.quickSell.assignToDebitDescription") ||
              "Create a debit record for the selected sales"}
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

              <div className="space-y-2">
                <FormLabel className="text-sm font-medium">
                  {t("common.debits.selectSales") || "Select Sales"}
                </FormLabel>
                <div className="border rounded-md p-3 space-y-2 max-h-[300px] overflow-y-auto">
                  {sellHistoryArray.map((sh) => {
                    const productName =
                      sh.product?.name || sh.service?.name || "Unknown";
                    const isService = !!sh.serviceId;
                    const debitItem = form
                      .watch("debitItems")
                      .find((item) => item.sellHistoryId === sh.id);
                    const isSelected = !!debitItem;

                    return (
                      <div
                        key={sh.id}
                        className="flex items-start gap-3 p-2 border rounded-md"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const currentItems = form.getValues("debitItems");
                            if (checked) {
                              form.setValue("debitItems", [
                                ...currentItems.filter(
                                  (item) => item.sellHistoryId !== sh.id
                                ),
                                {
                                  sellHistoryId: sh.id,
                                  amount: sh.totalPrice,
                                },
                              ]);
                            } else {
                              form.setValue(
                                "debitItems",
                                currentItems.filter(
                                  (item) => item.sellHistoryId !== sh.id
                                )
                              );
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {productName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(sh.createdAt), "MMM dd, yyyy")} •{" "}
                            {sh.amount} × {sh.soldPrice.toFixed(2)} ETB ={" "}
                            {sh.totalPrice.toFixed(2)} ETB
                          </p>
                          {isService && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              {t("common.service.service") || "Service"}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              max={sh.totalPrice}
                              value={debitItem?.amount || sh.totalPrice}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                const currentItems =
                                  form.getValues("debitItems");
                                form.setValue(
                                  "debitItems",
                                  currentItems.map((item) =>
                                    item.sellHistoryId === sh.id
                                      ? {
                                          ...item,
                                          amount: Math.min(
                                            value,
                                            sh.totalPrice
                                          ),
                                        }
                                      : item
                                  )
                                );
                              }}
                              className="h-8 w-24 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <FormField
                  control={form.control}
                  name="debitItems"
                  render={() => (
                    <FormItem>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        className="h-20 text-base sm:text-sm resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                disabled={createDebit.isPending}
                className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm"
              >
                {createDebit.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("common.debits.createDebit") || "Create Debit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
