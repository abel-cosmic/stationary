"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { useCreateCategory } from "@/lib/hooks/use-categories";
import { Loader2, FolderTree, Plus } from "lucide-react";

interface CategoryManagerProps {
  trigger?: React.ReactNode;
}

export function CategoryManager({ trigger }: CategoryManagerProps) {
  const [open, setOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const createCategory = useCreateCategory();

  const handleCreate = async () => {
    if (!newCategoryName.trim()) return;

    try {
      await createCategory.mutateAsync({ name: newCategoryName.trim() });
      setNewCategoryName("");
      setOpen(false);
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Create Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Create New Category
          </DialogTitle>
          <DialogDescription className="text-sm">
            Add a new category to organize your products.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newCategory" className="text-sm font-medium">
              Category Name
            </Label>
            <Input
              id="newCategory"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Pens, Notebooks, Office Supplies"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              className="h-11 sm:h-10 text-base sm:text-sm"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              setNewCategoryName("");
            }}
            className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!newCategoryName.trim() || createCategory.isPending}
            className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
          >
            {createCategory.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
