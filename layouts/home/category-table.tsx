"use client";

import { useEffect, useMemo } from "react";
import { usePagination } from "@/lib/hooks/use-pagination";
import { useDialog } from "@/lib/hooks/use-dialog";
import { useEditingStore } from "@/lib/stores";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import type { Category } from "@/types/api";
import { useRouter } from "next/navigation";
import {
  useUpdateCategory,
  useDeleteCategory,
} from "@/lib/hooks/use-categories";
import {
  FolderTree,
  Package,
  Edit,
  Trash2,
  Loader2,
  Check,
  X,
  Eye,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface CategoryTableProps {
  categories: Category[];
}

export function CategoryTable({ categories }: CategoryTableProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    currentPage,
    itemsPerPage,
    paginatedItems: paginatedCategories,
    totalItems,
    setPage,
    setItemsPerPage,
  } = usePagination("category-table", categories);

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">
                {t("common.table.name")}
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                {t("common.table.products")}
              </TableHead>
              <TableHead className="text-right min-w-[150px]">
                {t("common.table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCategories.map((category) => (
              <CategoryTableRow key={category.id} category={category} />
            ))}
          </TableBody>
        </Table>
      </div>
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}
    </div>
  );
}

interface CategoryTableRowProps {
  category: Category;
}

function CategoryTableRow({ category }: CategoryTableRowProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const productCount = category._count?.products ?? 0;
  const deleteDialog = useDialog(`delete-category-${category.id}`);

  // Editing store
  const editingId = `category-${category.id}`;
  const isEditing = useEditingStore((state) => state.isEditing(editingId));
  const editName = useEditingStore((state) => state.getEditValue(editingId));
  const startEditing = useEditingStore((state) => state.startEditing);
  const stopEditing = useEditingStore((state) => state.stopEditing);
  const updateEditValue = useEditingStore((state) => state.updateEditValue);
  const resetEditing = useEditingStore((state) => state.resetEditing);

  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  useEffect(() => {
    // Reset edit value when category name changes
    if (!isEditing) {
      resetEditing(editingId);
    }
  }, [category.name, isEditing, editingId, resetEditing]);

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;

    try {
      await updateCategory.mutateAsync({
        id: category.id,
        data: { name: editName.trim() },
      });
      stopEditing(editingId);
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleCancelEdit = () => {
    stopEditing(editingId);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCategory.mutateAsync(category.id);
      deleteDialog.close();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  return (
    <>
      <TableRow className="hover:bg-accent">
        <TableCell className="font-medium">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => updateEditValue(editingId, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveEdit();
                  } else if (e.key === "Escape") {
                    handleCancelEdit();
                  }
                }}
                className="h-9 flex-1"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={handleSaveEdit}
                disabled={updateCategory.isPending}
                title={t("common.buttons.save")}
              >
                {updateCategory.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={handleCancelEdit}
                title={t("common.buttons.cancel")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push(`/categories/${category.id}`)}
            >
              <FolderTree className="h-4 w-4 text-muted-foreground" />
              <span>{category.name}</span>
            </div>
          )}
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>
              {productCount}{" "}
              {productCount !== 1
                ? t("common.product.productsPlural")
                : t("common.product.products")}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            {!isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/categories/${category.id}`)}
                  className="h-9 w-9 p-0 touch-manipulation"
                  title={t("common.buttons.viewProducts")}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 touch-manipulation"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(editingId, category.name);
                  }}
                  title={t("common.category.edit")}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-destructive hover:text-destructive touch-manipulation"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDialog.open();
                  }}
                  disabled={deleteCategory.isPending}
                  title={t("common.category.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) =>
          open ? deleteDialog.open() : deleteDialog.close()
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.category.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {productCount > 0 ? (
                <>
                  {t("common.category.deleteConfirmWithProducts", {
                    name: category.name,
                    count: productCount,
                  })}
                </>
              ) : (
                <>
                  {t("common.category.deleteConfirm", { name: category.name })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => deleteDialog.close()}
            >
              {t("common.buttons.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("common.buttons.deletePermanently")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
