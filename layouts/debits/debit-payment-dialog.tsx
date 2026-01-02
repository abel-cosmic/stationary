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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { usePayDebit } from "@/lib/hooks/use-debits";
import type { Debit } from "@/types/api";
import { Loader2, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";

const payDebitSchema = (t: (key: string) => string, maxAmount: number) =>
  z.object({
    amount: z.coerce
      .number()
      .positive(t("common.debits.amountRequired") || "Amount is required")
      .max(
        maxAmount,
        t("common.debits.amountExceedsRemaining") ||
          `Amount cannot exceed remaining balance of ${maxAmount.toFixed(2)}`
      ),
  });

interface DebitPaymentDialogProps {
  debit: Debit;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function DebitPaymentDialog({
  debit,
  trigger,
  onSuccess,
}: DebitPaymentDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const payDebit = usePayDebit();

  const remaining = debit.totalAmount - debit.paidAmount;

  const schema = useMemo(() => payDebitSchema(t, remaining), [t, remaining]);

  type PaymentFormValues = {
    amount: number;
  };

  const form = useForm<PaymentFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      amount: remaining,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        amount: remaining,
      });
    }
  }, [open, remaining, form]);

  const onSubmit = async (data: PaymentFormValues) => {
    try {
      await payDebit.mutateAsync({
        id: debit.id,
        data: {
          amount: data.amount,
        },
      });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error recording payment:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <DollarSign className="mr-2 h-4 w-4" />
            {t("common.debits.recordPayment") || "Record Payment"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {t("common.debits.recordPayment") || "Record Payment"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t("common.debits.recordPaymentDescription") ||
              `Record a payment for ${debit.customerName || "this debit"}`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("common.debits.totalAmount") || "Total Amount"}:
                  </span>
                  <span className="font-medium">
                    {debit.totalAmount.toFixed(2)} ETB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("common.debits.paidAmount") || "Paid Amount"}:
                  </span>
                  <span className="font-medium">
                    {debit.paidAmount.toFixed(2)} ETB
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span>{t("common.debits.remaining") || "Remaining"}:</span>
                  <span className="text-destructive">
                    {remaining.toFixed(2)} ETB
                  </span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.debits.paymentAmount") || "Payment Amount"}{" "}
                      (ETB)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={remaining}
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value || ""}
                        className="h-11 sm:h-10 text-base sm:text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      {t("common.debits.maxPayment") || "Maximum"}:{" "}
                      {remaining.toFixed(2)} ETB
                    </p>
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
                disabled={payDebit.isPending}
                className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm"
              >
                {payDebit.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("common.debits.recordPayment") || "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
