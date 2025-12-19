import type {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from "@/types/api";

/**
 * Repository interface for category data access
 * Follows Dependency Inversion Principle - components depend on abstraction, not concrete implementation
 */
export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  create(data: CreateCategoryData): Promise<Category>;
  update(id: number, data: UpdateCategoryData): Promise<Category>;
  delete(id: number): Promise<void>;
}
