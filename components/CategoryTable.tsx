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

interface CategoryTableProps {
  categories: Category[];
}

export function CategoryTable({ categories }: CategoryTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Name</TableHead>
            <TableHead className="hidden sm:table-cell">Products</TableHead>
            <TableHead className="text-right min-w-[150px]">Actions</TableHead>
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
                title="Save"
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
                title="Cancel"
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
              {productCount} product{productCount !== 1 ? "s" : ""}
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
                  title="View Products"
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
                  title="Edit category"
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
                  title="Delete category"
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
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              {productCount > 0 ? (
                <>
                  Are you sure you want to delete "{category.name}"? This will
                  permanently delete the category and all {productCount} product
                  {productCount !== 1 ? "s" : ""} associated with it, including
                  all sell history. This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete "{category.name}"? This action
                  cannot be undone.
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
              Cancel
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
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

