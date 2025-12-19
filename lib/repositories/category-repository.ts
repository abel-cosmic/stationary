import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CreateCategoryData,
  type UpdateCategoryData,
} from "@/lib/api";
import type { ICategoryRepository } from "@/lib/interfaces/category-repository.interface";
import type { Category } from "@/types/api";

/**
 * Category repository implementation
 * Wraps API calls and implements ICategoryRepository interface
 */
export class CategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    return getCategories();
  }

  async create(data: CreateCategoryData): Promise<Category> {
    return createCategory(data);
  }

  async update(id: number, data: UpdateCategoryData): Promise<Category> {
    return updateCategory(id, data);
  }

  async delete(id: number): Promise<void> {
    return deleteCategory(id);
  }
}

// Export singleton instance
export const categoryRepository = new CategoryRepository();
