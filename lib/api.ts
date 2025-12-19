import axios from "axios";
import type {
  Category,
  Product,
  SellHistory,
  Service,
  CreateProductData,
  UpdateProductData,
  SellProductData,
  Transaction,
  BulkSellRequest,
  CreateCategoryData,
  UpdateCategoryData,
  CreateServiceData,
  UpdateServiceData,
  SellServiceData,
} from "@/types/api";

export const api = axios.create({ baseURL: "/api" });

// Re-export types for backward compatibility
export type {
  Category,
  Product,
  SellHistory,
  Service,
  CreateProductData,
  UpdateProductData,
  SellProductData,
  Transaction,
  BulkSellRequest,
  CreateCategoryData,
  UpdateCategoryData,
  CreateServiceData,
  UpdateServiceData,
  SellServiceData,
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

// Service API functions
export const getServices = async (): Promise<Service[]> => {
  const response = await api.get<Service[]>("/services");
  return response.data;
};

export const getServiceById = async (id: number): Promise<Service> => {
  const response = await api.get<Service>(`/services/${id}`);
  return response.data;
};

export const createService = async (
  data: CreateServiceData
): Promise<Service> => {
  const response = await api.post<Service>("/services", data);
  return response.data;
};

export const updateService = async (
  id: number,
  data: UpdateServiceData
): Promise<Service> => {
  const response = await api.put<Service>(`/services/${id}`, data);
  return response.data;
};

export const deleteService = async (id: number): Promise<void> => {
  await api.delete(`/services/${id}`);
};

export const sellService = async (
  id: number,
  data: SellServiceData
): Promise<Service> => {
  const response = await api.post<Service>(`/services/${id}/sell`, data);
  return response.data;
};
