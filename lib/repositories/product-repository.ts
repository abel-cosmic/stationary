import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  sellProduct,
  type CreateProductData,
  type UpdateProductData,
  type SellProductData,
} from "@/lib/api";
import type { IProductRepository } from "@/lib/interfaces/product-repository.interface";
import type { Product } from "@/types/api";

/**
 * Product repository implementation
 * Wraps API calls and implements IProductRepository interface
 */
export class ProductRepository implements IProductRepository {
  async getAll(): Promise<Product[]> {
    return getProducts();
  }

  async getById(id: number): Promise<Product> {
    return getProductById(id);
  }

  async create(data: CreateProductData): Promise<Product> {
    return createProduct(data);
  }

  async update(id: number, data: UpdateProductData): Promise<Product> {
    return updateProduct(id, data);
  }

  async delete(id: number): Promise<void> {
    return deleteProduct(id);
  }

  async sell(id: number, data: SellProductData): Promise<Product> {
    return sellProduct(id, data);
  }
}

// Export singleton instance
export const productRepository = new ProductRepository();
