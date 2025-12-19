"use client";

import { useEffect, useMemo } from "react";
import { useDialog } from "@/lib/hooks/use-dialog";
import { useDialogStore } from "@/lib/stores";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "@/lib/hooks/use-services";
import { Loader2, Plus, Pencil, Trash2, Wrench } from "lucide-react";
import type { Service } from "@/types/api";

const createServiceSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .min(1, t("common.service.nameRequired") || "Name is required")
      .trim(),
    defaultPrice: z.coerce
      .number()
      .positive(t("common.service.priceRequired") || "Price must be positive")
      .min(0.01, t("common.service.priceMin") || "Price must be at least 0.01"),
    description: z.string().optional().nullable(),
  });

const updateServiceSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .min(1, t("common.service.nameRequired") || "Name is required")
      .trim(),
    defaultPrice: z.coerce
      .number()
      .positive(t("common.service.priceRequired") || "Price must be positive")
      .min(0.01, t("common.service.priceMin") || "Price must be at least 0.01"),
    description: z.string().optional().nullable(),
  });

type ServiceFormValues = {
  name: string;
  defaultPrice: number;
  description?: string | null;
};

interface ServiceManagerProps {
  trigger?: React.ReactNode;
}

export function ServiceManager({ trigger }: ServiceManagerProps) {
  const { t } = useTranslation();
  const dialog = useDialog("service-manager");
  const editingService = useDialogStore((state) => state.editingService);
  const setEditingService = useDialogStore((state) => state.setEditingService);
  const { data: services, isLoading } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const schema = useMemo(
    () => (editingService ? updateServiceSchema(t) : createServiceSchema(t)),
    [editingService, t]
  );

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      defaultPrice: 0,
      description: null,
    },
  });

  // Reset form when dialog opens/closes or editing changes
  useEffect(() => {
    if (!dialog.isOpen) {
      form.reset({
        name: "",
        defaultPrice: 0,
        description: null,
      });
      setEditingService(null);
    } else if (editingService) {
      form.reset({
        name: editingService.name,
        defaultPrice: editingService.defaultPrice,
        description: editingService.description ?? null,
      });
    }
  }, [dialog.isOpen, editingService, form, setEditingService]);

  const onSubmit = async (data: ServiceFormValues) => {
    try {
      if (editingService) {
        await updateService.mutateAsync({
          id: editingService.id,
          data,
        });
      } else {
        await createService.mutateAsync(data);
      }
      dialog.close();
      setEditingService(null);
    } catch (error) {
      console.error("Error saving service:", error);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
  };

  const handleDelete = async (id: number) => {
    if (
      confirm(
        t("common.service.confirmDelete") ||
          "Are you sure you want to delete this service?"
      )
    ) {
      try {
        await deleteService.mutateAsync(id);
      } catch (error) {
        console.error("Error deleting service:", error);
      }
    }
  };

  return (
    <Dialog
      open={dialog.isOpen}
      onOpenChange={(open) => (open ? dialog.open() : dialog.close())}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Wrench className="mr-2 h-4 w-4" />
            {t("common.service.manage") || "Manage Services"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {editingService
              ? t("common.service.edit") || "Edit Service"
              : t("common.service.create") || "Create Service"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {editingService
              ? t("common.service.editDescription") || "Update service details"
              : t("common.service.createDescription") ||
                "Add a new service to track"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        {t("common.service.name") || "Service Name"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            t("common.service.namePlaceholder") ||
                            "e.g., Printing, Typing"
                          }
                          className="h-11 sm:h-10 text-base sm:text-sm"
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        {t("common.service.defaultPrice") || "Default Price"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          className="h-11 sm:h-10 text-base sm:text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        {t("common.service.description") || "Description"}
                        <span className="text-muted-foreground ml-1">
                          ({t("common.optional") || "Optional"})
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder={
                            t("common.service.descriptionPlaceholder") ||
                            "Add a description for this service"
                          }
                          className="min-h-[80px] text-base sm:text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-4">
                  {editingService && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingService(null);
                        form.reset({
                          name: "",
                          defaultPrice: 0,
                          description: null,
                        });
                      }}
                      className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm"
                    >
                      {t("common.buttons.cancel")}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={
                      createService.isPending || updateService.isPending
                    }
                    className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm"
                  >
                    {(createService.isPending || updateService.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingService
                      ? t("common.buttons.update") || "Update"
                      : t("common.buttons.create") || "Create"}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </Form>

          {/* Services List */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">
                {t("common.service.list") || "Services"}
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingService(null);
                  form.reset({
                    name: "",
                    defaultPrice: 0,
                    description: null,
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("common.service.addNew") || "Add New"}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !services || services.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {t("common.service.noServices") ||
                    "No services yet. Create your first service above."}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          {t("common.service.name") || "Name"}
                        </TableHead>
                        <TableHead>
                          {t("common.service.defaultPrice") || "Price"}
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">
                          {t("common.service.revenue") || "Revenue"}
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          {t("common.service.totalSold") || "Total Sold"}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("common.actions") || "Actions"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">
                            {service.name}
                          </TableCell>
                          <TableCell>
                            {service.defaultPrice.toFixed(2)} ETB
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {service.revenue.toFixed(2)} ETB
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {service.totalSold}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(service)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(service.id)}
                                disabled={deleteService.isPending}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
