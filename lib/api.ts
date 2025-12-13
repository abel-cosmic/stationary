import axios from "axios";
import type {
  Category,
  Product,
  SellHistory,
  CreateProductData,
  UpdateProductData,
  SellProductData,
  Transaction,
  BulkSellRequest,
  CreateCategoryData,
  UpdateCategoryData,
} from "@/types/api";

export const api = axios.create({ baseURL: "/api" });

// Re-export types for backward compatibility
export type {
  Category,
  Product,
  SellHistory,
  CreateProductData,
  UpdateProductData,
  SellProductData,
  Transaction,
  BulkSellRequest,
  CreateCategoryData,
  UpdateCategoryData,
};

export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get<Product[]>("/products");
  return response.data;
};

export const getProductById = async (id: number): Promise<Product> => {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
};

export const createProduct = async (
  data: CreateProductData
): Promise<Product> => {
  const response = await api.post<Product>("/products", data);
  return response.data;
};

export const updateProduct = async (
  id: number,
  data: UpdateProductData
): Promise<Product> => {
  const response = await api.put<Product>(`/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/products/${id}`);
};

export const sellProduct = async (
  id: number,
  data: SellProductData
): Promise<Product> => {
  const response = await api.post<Product>(`/products/${id}/sell`, data);
  return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<Category[]>("/categories");
  return response.data;
};

export const createCategory = async (
  data: CreateCategoryData
): Promise<Category> => {
  const response = await api.post<Category>("/categories", data);
  return response.data;
};

export const updateCategory = async (
  id: number,
  data: UpdateCategoryData
): Promise<Category> => {
  const response = await api.put<Category>(`/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/categories/${id}`);
};

export const bulkSell = async (data: BulkSellRequest): Promise<Transaction> => {
  const response = await api.post<Transaction>("/sell/bulk", data);
  return response.data;
};
