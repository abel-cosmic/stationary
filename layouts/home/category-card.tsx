"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "lucide-react";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
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
      <Card className="hover:shadow-lg transition-shadow active:scale-[0.98]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            {isEditing ? (
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
                className="h-10 sm:h-9 flex-1 text-base"
                autoFocus
              />
            ) : (
              <CardTitle
                className="flex items-center gap-2 cursor-pointer flex-1 text-base sm:text-lg min-w-0"
                onClick={() => router.push(`/categories/${category.id}`)}
              >
                <FolderTree className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">{category.name}</span>
              </CardTitle>
            )}
            <div className="flex gap-1 flex-shrink-0">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 sm:h-9 sm:w-9 p-0 touch-manipulation"
                    onClick={handleSaveEdit}
                    disabled={updateCategory.isPending}
                    title={t("common.buttons.save")}
                  >
                    {updateCategory.isPending ? (
                      <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" />
                    ) : (
                      <Check className="h-5 w-5 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 sm:h-9 sm:w-9 p-0 touch-manipulation"
                    onClick={handleCancelEdit}
                    title={t("common.buttons.cancel")}
                  >
                    <X className="h-5 w-5 sm:h-4 sm:w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 sm:h-9 sm:w-9 p-0 touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    title={t("common.category.edit")}
                  >
                    <Edit className="h-5 w-5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 sm:h-9 sm:w-9 p-0 text-destructive hover:text-destructive touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogOpen(true);
                    }}
                    disabled={deleteCategory.isPending}
                    title={t("common.category.delete")}
                  >
                    <Trash2 className="h-5 w-5 sm:h-4 sm:w-4 text-red-500" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">
              {productCount}{" "}
              {productCount !== 1
                ? t("common.product.productsPlural")
                : t("common.product.products")}
            </span>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button
            onClick={() => router.push(`/categories/${category.id}`)}
            className="w-full h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
            size="default"
          >
            {t("common.buttons.viewProducts")}
          </Button>
        </CardFooter>
      </Card>

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
