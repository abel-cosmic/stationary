"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useCategories, useCreateCategory } from "@/lib/hooks/use-categories";
import { Loader2, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

interface CategorySelectProps {
  value?: number | null;
  onValueChange?: (value: number | null) => void;
  placeholder?: string;
}

export function CategorySelect({
  value,
  onValueChange,
  placeholder,
}: CategorySelectProps) {
  const { t } = useTranslation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();

  const defaultPlaceholder = placeholder || t("common.product.selectCategory");

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await createCategory.mutateAsync({
        name: newCategoryName.trim(),
      });
      setNewCategoryName("");
      setCreateDialogOpen(false);
      if (onValueChange && newCategory) {
        onValueChange(newCategory.id);
      }
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Select
          value={value?.toString() ?? "none"}
          onValueChange={(val) => {
            if (val === "none") {
              onValueChange?.(null);
            } else {
              onValueChange?.(parseInt(val));
            }
          }}
        >
          <SelectTrigger className="flex-1 h-11 sm:h-10 text-base sm:text-sm">
            <SelectValue placeholder={defaultPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              {t("common.categorySelect.none")}
            </SelectItem>
            {isLoading ? (
              <SelectItem value="loading" disabled>
                {t("common.categorySelect.loading")}
              </SelectItem>
            ) : (
              categories?.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => setCreateDialogOpen(true)}
          className="shrink-0 h-11 w-11 sm:h-10 sm:w-10 p-0 touch-manipulation"
        >
          <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
        </Button>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {t("common.categorySelect.createNew")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("common.categorySelect.addNew")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName" className="text-sm font-medium">
                {t("common.categorySelect.name")}
              </Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={t("common.categorySelect.namePlaceholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
                className="h-11 sm:h-10 text-base sm:text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewCategoryName("");
              }}
              className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
            >
              {t("common.buttons.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || createCategory.isPending}
              className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
            >
              {createCategory.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("common.buttons.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
