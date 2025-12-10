import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

export interface Product {
  id: number;
  name: string;
  initialPrice: number;
  sellingPrice: number;
  quantity: number;
  totalSold: number;
  revenue: number;
  profit: number;
  createdAt: string;
  updatedAt: string;
  sellHistory?: SellHistory[];
  _count?: {
    sellHistory: number;
  };
}

export interface SellHistory {
  id: number;
  productId: number;
  amount: number;
  soldPrice: number;
  totalPrice: number;
  createdAt: string;
}

export interface CreateProductData {
  name: string;
  initialPrice: number;
  sellingPrice: number;
  quantity: number;
}

export interface UpdateProductData {
  name?: string;
  initialPrice?: number;
  sellingPrice?: number;
  quantity?: number;
}

export interface SellProductData {
  amount: number;
  soldPrice: number;
}

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

