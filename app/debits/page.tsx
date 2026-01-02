"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DebitTable } from "@/layouts/debits/debit-table";
import { DebitDialog } from "@/layouts/debits/debit-dialog";
import { DebitPaymentDialog } from "@/layouts/debits/debit-payment-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDebits, useDeleteDebit } from "@/lib/hooks/use-debits";
import { Plus, ArrowLeft, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { ThemeToggle } from "@/layouts/common/theme-toggle";
import { LanguageToggle } from "@/layouts/common/language-toggle";
import type { Debit } from "@/types/api";

export default function DebitsPage() {
  const { t } = useTranslation();
  const { data: debits, isLoading } = useDebits();
  const deleteDebit = useDeleteDebit();
  const [editingDebit, setEditingDebit] = useState<Debit | undefined>();
  const [payingDebit, setPayingDebit] = useState<Debit | undefined>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [debitToDelete, setDebitToDelete] = useState<Debit | null>(null);

  const handleEdit = (debit: Debit) => {
    setEditingDebit(debit);
  };

  const handleDelete = (debit: Debit) => {
    setDebitToDelete(debit);
    setDeleteConfirmOpen(true);
  };

  const handlePay = (debit: Debit) => {
    setPayingDebit(debit);
  };

  const handleDeleteConfirm = async () => {
    if (debitToDelete) {
      try {
        await deleteDebit.mutateAsync(debitToDelete.id);
        setDebitToDelete(null);
      } catch (error) {
        console.error("Error deleting debit:", error);
      }
    }
  };

  const totalDebits = debits?.reduce((sum, d) => sum + d.totalAmount, 0) || 0;
  const totalPaid = debits?.reduce((sum, d) => sum + d.paidAmount, 0) || 0;
  const totalRemaining = totalDebits - totalPaid;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8 flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold">
                  {t("common.debits.title") || "Debits Management"}
                </h1>
              </div>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                {t("common.debits.description") ||
                  "Track and manage customer debits and payments"}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              {t("common.debits.totalDebits") || "Total Debits"}
            </p>
            <p className="text-2xl font-bold">{totalDebits.toFixed(2)} ETB</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              {t("common.debits.totalPaid") || "Total Paid"}
            </p>
            <p className="text-2xl font-bold text-green-600">
              {totalPaid.toFixed(2)} ETB
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              {t("common.debits.totalRemaining") || "Total Remaining"}
            </p>
            <p className="text-2xl font-bold text-destructive">
              {totalRemaining.toFixed(2)} ETB
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-4">
          <DebitDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("common.debits.createDebit") || "Create Debit"}
              </Button>
            }
            onSuccess={() => {
              setEditingDebit(undefined);
            }}
          />
        </div>

        {/* Debits Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("common.loading") || "Loading..."}
          </div>
        ) : (
          <DebitTable
            debits={debits || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPay={handlePay}
          />
        )}

        {/* Edit Dialog */}
        {editingDebit && (
          <DebitDialog
            debit={editingDebit}
            trigger={<div style={{ display: "none" }} />}
            onSuccess={() => {
              setEditingDebit(undefined);
            }}
          />
        )}

        {/* Payment Dialog */}
        {payingDebit && (
          <DebitPaymentDialog
            debit={payingDebit}
            trigger={<div style={{ display: "none" }} />}
            onSuccess={() => {
              setPayingDebit(undefined);
            }}
          />
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title={t("common.debits.deleteDebit") || "Delete Debit"}
          message={
            t("common.debits.deleteDebitConfirm") ||
            "Are you sure you want to delete this debit? This action cannot be undone."
          }
          variant="destructive"
          confirmLabel={t("common.buttons.delete") || "Delete"}
          cancelLabel={t("common.buttons.cancel") || "Cancel"}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setDebitToDelete(null);
          }}
        />
      </div>
    </div>
  );
}
