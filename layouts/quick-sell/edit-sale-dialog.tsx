"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
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
import { Calendar } from "@/components/ui/calendar";
import { useUpdateSellHistory } from "@/lib/hooks/use-sell-history";
import type { SellHistory } from "@/types/api";
import { Loader2, Edit, CalendarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const createSaleSchema = (t: (key: string) => string) =>
  z.object({
    amount: z.coerce
      .number()
      .int(t("common.validation.amountMustBeInteger"))
      .positive(t("common.validation.amountMustBePositive"))
      .min(1, t("common.validation.amountMustBeAtLeast1")),
    soldPrice: z.coerce
      .number()
      .positive(t("common.validation.sellingPriceMustBePositive"))
      .min(0.01, t("common.validation.sellingPriceMustBeAtLeast001")),
    createdAt: z.date(),
  });

type SaleFormValues = {
  amount: number;
  soldPrice: number;
  createdAt: Date;
};

interface EditSaleDialogProps {
  sellHistory: SellHistory;
  trigger?: React.ReactNode;
}

function DatePickerField({
  field,
  t,
}: {
  field: any;
  t: (key: string) => string;
}) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  return (
    <FormItem className="flex flex-col">
      <FormLabel className="text-sm font-medium">
        {t("common.sellHistory.dateSold") || "Date Sold"}
      </FormLabel>
      <FormControl>
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className={cn(
              "w-full pl-3 text-left font-normal h-11 sm:h-10 text-base sm:text-sm",
              !field.value && "text-muted-foreground"
            )}
          >
            {field.value ? (
              format(field.value, "PPP")
            ) : (
              <span>{t("common.quickSell.selectDate") || "Pick a date"}</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
          {isCalendarOpen && (
            <div className="border rounded-md p-3 bg-card">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={(date) => {
                  if (date) {
                    field.onChange(date);
                    setIsCalendarOpen(false);
                  }
                }}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
              />
            </div>
          )}
        </div>
      </FormControl>
    </FormItem>
  );
}

export function EditSaleDialog({ sellHistory, trigger }: EditSaleDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const updateSellHistory = useUpdateSellHistory();

  const schema = useMemo(() => createSaleSchema(t), [t]);

  const form = useForm<SaleFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      amount: sellHistory.amount,
      soldPrice: sellHistory.soldPrice,
      createdAt: new Date(sellHistory.createdAt),
    },
  });

  // Reset form when dialog opens or sellHistory changes
  useEffect(() => {
    if (open) {
      form.reset({
        amount: sellHistory.amount,
        soldPrice: sellHistory.soldPrice,
        createdAt: new Date(sellHistory.createdAt),
      });
    }
  }, [open, sellHistory, form]);

  const onSubmit = async (data: SaleFormValues) => {
    try {
      await updateSellHistory.mutateAsync({
        id: sellHistory.id,
        data: {
          amount: data.amount,
          soldPrice: data.soldPrice,
          createdAt: data.createdAt.toISOString(),
        },
      });
      setOpen(false);
    } catch (error) {
      console.error("Error updating sale:", error);
    }
  };

  const productName =
    sellHistory.product?.name || sellHistory.service?.name || "Unknown";
  const isService = !!sellHistory.serviceId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            {t("common.quickSell.edit") || "Edit"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {t("common.quickSell.editSale") || "Edit Sale"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t("common.quickSell.editSaleDescription") ||
              `Edit sale details for ${productName}`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">{productName}</p>
                {isService && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("common.service.service") || "Service"}
                  </p>
                )}
                {sellHistory.product?.category && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {sellHistory.product.category.name}
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.quickSell.amount")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value || ""}
                        className="h-11 sm:h-10 text-base sm:text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="soldPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.quickSell.pricePerUnit")} (ETB)
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

              <div className="p-2 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  {t("common.analytics.totalRevenueLabel")}:
                </p>
                <p className="text-lg font-semibold">
                  {(
                    (form.watch("amount") || 0) * (form.watch("soldPrice") || 0)
                  ).toFixed(2)}{" "}
                  ETB
                </p>
              </div>

              <FormField
                control={form.control}
                name="createdAt"
                render={({ field }) => (
                  <>
                    <DatePickerField field={field} t={t} />
                    <FormMessage />
                  </>
                )}
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
              >
                {t("common.buttons.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={updateSellHistory.isPending}
                className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
              >
                {updateSellHistory.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("common.buttons.saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
