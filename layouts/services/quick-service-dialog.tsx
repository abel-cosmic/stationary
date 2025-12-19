"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServices, useSellService } from "@/lib/hooks/use-services";
import { Loader2, Wrench } from "lucide-react";

const sellServiceSchema = (t: (key: string) => string) =>
  z.object({
    serviceId: z.coerce
      .number()
      .int(t("common.service.mustSelect"))
      .positive(t("common.service.mustSelect")),
    amount: z.coerce
      .number()
      .int(t("common.validation.amountMustBeInteger"))
      .positive(t("common.validation.amountMustBePositive"))
      .min(1, t("common.validation.amountMustBeAtLeast1")),
    soldPrice: z.coerce
      .number()
      .positive(t("common.validation.sellingPriceMustBePositive"))
      .min(0.01, t("common.validation.sellingPriceMustBeAtLeast001")),
  });

type SellServiceFormValues = {
  serviceId: number;
  amount: number;
  soldPrice: number;
};

interface QuickServiceDialogProps {
  trigger?: React.ReactNode;
}

export function QuickServiceDialog({ trigger }: QuickServiceDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data: services, isLoading: servicesLoading } = useServices();
  const sellService = useSellService();

  const schema = useMemo(() => sellServiceSchema(t), [t]);

  const form = useForm<SellServiceFormValues>({
    // @ts-expect-error - zodResolver type inference issue with dynamic translations
    resolver: zodResolver(schema),
    defaultValues: {
      serviceId: 0,
      amount: 1,
      soldPrice: 0,
    },
  });

  const selectedServiceId = form.watch("serviceId");

  // Get selected service details
  const selectedService = useMemo(() => {
    if (!selectedServiceId || !services) return null;
    return services.find((s) => s.id === selectedServiceId) || null;
  }, [selectedServiceId, services]);

  // Update sold price when service changes
  useEffect(() => {
    if (selectedService) {
      form.setValue("soldPrice", selectedService.defaultPrice);
    }
  }, [selectedService, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset({
        serviceId: 0,
        amount: 1,
        soldPrice: 0,
      });
    }
  }, [open, form]);

  const onSubmit = async (data: SellServiceFormValues) => {
    if (!selectedService) {
      return;
    }

    try {
      await sellService.mutateAsync({
        id: data.serviceId,
        data: { amount: data.amount, soldPrice: data.soldPrice },
      });
      setOpen(false);
      form.reset({
        serviceId: 0,
        amount: 1,
        soldPrice: 0,
      });
    } catch (error) {
      console.error("Error selling service:", error);
    }
  };

  const amount = form.watch("amount");
  const soldPrice = form.watch("soldPrice");
  const totalPrice = useMemo(() => {
    if (amount > 0 && soldPrice > 0) {
      return amount * soldPrice;
    }
    return 0;
  }, [amount, soldPrice]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Wrench className="mr-2 h-4 w-4" />
            {t("common.service.quickSell")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {t("common.service.quickSell")}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t("common.service.quickSellDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            // @ts-expect-error - Type inference issue with dynamic zod schema
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="space-y-4 py-4">
              <FormField
                // @ts-expect-error - Type inference issue with dynamic zod schema
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.service.service")}
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value?.toString() ?? ""}
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                        }}
                        disabled={
                          servicesLoading || !services || services.length === 0
                        }
                      >
                        <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                          <SelectValue
                            placeholder={t("common.service.selectService")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {servicesLoading ? (
                            <SelectItem value="loading" disabled>
                              {t("common.loading")}
                            </SelectItem>
                          ) : !services || services.length === 0 ? (
                            <SelectItem value="none" disabled>
                              {t("common.service.noServicesAvailable")}
                            </SelectItem>
                          ) : (
                            services.map((service) => (
                              <SelectItem
                                key={service.id}
                                value={service.id.toString()}
                              >
                                {service.name} (
                                {service.defaultPrice.toFixed(2)}{" "}
                                {t("common.excel.units.etb")})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                // @ts-expect-error - Type inference issue with dynamic zod schema
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.service.amount")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value || ""}
                        className="h-11 sm:h-10 text-base sm:text-sm"
                        placeholder={t("common.service.enterAmount")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                // @ts-expect-error - Type inference issue with dynamic zod schema
                control={form.control}
                name="soldPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t("common.service.pricePerUnit")}
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
                        placeholder={
                          selectedService
                            ? selectedService.defaultPrice.toFixed(2)
                            : "0.00"
                        }
                      />
                    </FormControl>
                    {selectedService && (
                      <p className="text-xs text-muted-foreground">
                        {t("common.quickSell.default")}:{" "}
                        {selectedService.defaultPrice.toFixed(2)}{" "}
                        {t("common.excel.units.etb")}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {totalPrice > 0 && (
                <div className="p-3 bg-muted rounded-md border">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("common.analytics.totalRevenueLabel")}
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-primary">
                    {totalPrice.toFixed(2)} {t("common.excel.units.etb")}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  form.reset({
                    serviceId: 0,
                    amount: 1,
                    soldPrice: 0,
                  });
                }}
                className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm"
              >
                {t("common.buttons.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={sellService.isPending || !selectedService}
                className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm"
              >
                {sellService.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("common.service.sell")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
