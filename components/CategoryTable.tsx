"use client";

import { useState, useEffect } from "react";
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
import { Category } from "@/lib/api";
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

  return (
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
          {categories.map((category) => (
            <CategoryTableRow key={category.id} category={category} />
          ))}
        </TableBody>
      </Table>
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
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  useEffect(() => {
    setEditName(category.name);
  }, [category.name]);

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;

    try {
      await updateCategory.mutateAsync({
        id: category.id,
        data: { name: editName.trim() },
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditName(category.name);
    setIsEditing(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCategory.mutateAsync(category.id);
      setDeleteDialogOpen(false);
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
                onChange={(e) => setEditName(e.target.value)}
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
                    setIsEditing(true);
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
                    setDeleteDialogOpen(true);
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
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
              onClick={() => setDeleteDialogOpen(false)}
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
