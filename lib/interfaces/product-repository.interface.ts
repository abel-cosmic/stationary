import type {
  Product,
  CreateProductData,
  UpdateProductData,
  SellProductData,
} from "@/types/api";

/**
 * Repository interface for product data access
 * Follows Dependency Inversion Principle - components depend on abstraction, not concrete implementation
 */
export interface IProductRepository {
  getAll(): Promise<Product[]>;
  getById(id: number): Promise<Product>;
  create(data: CreateProductData): Promise<Product>;
  update(id: number, data: UpdateProductData): Promise<Product>;
  delete(id: number): Promise<void>;
  sell(id: number, data: SellProductData): Promise<Product>;
}
