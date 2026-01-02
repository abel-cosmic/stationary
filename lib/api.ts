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
  Debit,
  CreateDebitData,
  UpdateDebitData,
  PayDebitData,
  UpdateSellHistoryData,
  SupplyExpense,
  CreateSupplyExpenseData,
  UpdateSupplyExpenseData,
  DailyExpense,
  CreateDailyExpenseData,
  UpdateDailyExpenseData,
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
  Debit,
  CreateDebitData,
  UpdateDebitData,
  PayDebitData,
  SupplyExpense,
  CreateSupplyExpenseData,
  UpdateSupplyExpenseData,
  DailyExpense,
  CreateDailyExpenseData,
  UpdateDailyExpenseData,
  UpdateSellHistoryData,
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

// Debit API functions
export const getDebits = async (params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Debit[]> => {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append("status", params.status);
  if (params?.startDate) searchParams.append("startDate", params.startDate);
  if (params?.endDate) searchParams.append("endDate", params.endDate);
  const query = searchParams.toString();
  const response = await api.get<Debit[]>(`/debits${query ? `?${query}` : ""}`);
  return response.data;
};

export const getDebitById = async (id: number): Promise<Debit> => {
  const response = await api.get<Debit>(`/debits/${id}`);
  return response.data;
};

export const createDebit = async (data: CreateDebitData): Promise<Debit> => {
  const response = await api.post<Debit>("/debits", data);
  return response.data;
};

export const updateDebit = async (
  id: number,
  data: UpdateDebitData
): Promise<Debit> => {
  const response = await api.put<Debit>(`/debits/${id}`, data);
  return response.data;
};

export const deleteDebit = async (id: number): Promise<void> => {
  await api.delete(`/debits/${id}`);
};

export const payDebit = async (
  id: number,
  data: PayDebitData
): Promise<Debit> => {
  const response = await api.post<Debit>(`/debits/${id}/pay`, data);
  return response.data;
};

export const removeDebitItem = async (sellHistoryId: number): Promise<void> => {
  await api.post("/debits/remove-item", { sellHistoryId });
};

// Sell History API functions
export const getSellHistory = async (params?: {
  productId?: number;
  serviceId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<SellHistory[]> => {
  const searchParams = new URLSearchParams();
  if (params?.productId)
    searchParams.append("productId", params.productId.toString());
  if (params?.serviceId)
    searchParams.append("serviceId", params.serviceId.toString());
  if (params?.startDate) searchParams.append("startDate", params.startDate);
  if (params?.endDate) searchParams.append("endDate", params.endDate);
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  const query = searchParams.toString();
  const response = await api.get<SellHistory[]>(
    `/sell-history${query ? `?${query}` : ""}`
  );
  return response.data;
};

export const getSellHistoryById = async (id: number): Promise<SellHistory> => {
  const response = await api.get<SellHistory>(`/sell-history/${id}`);
  return response.data;
};

export const updateSellHistory = async (
  id: number,
  data: UpdateSellHistoryData
): Promise<SellHistory> => {
  const response = await api.put<SellHistory>(`/sell-history/${id}`, data);
  return response.data;
};

export const deleteSellHistory = async (id: number): Promise<void> => {
  await api.delete(`/sell-history/${id}`);
};

// Supply Expense API functions
export const getSupplyExpenses = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<SupplyExpense[]> => {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.append("startDate", params.startDate);
  if (params?.endDate) searchParams.append("endDate", params.endDate);
  const query = searchParams.toString();
  const response = await api.get<SupplyExpense[]>(
    `/expenses/supply${query ? `?${query}` : ""}`
  );
  return response.data;
};

export const getSupplyExpenseById = async (
  id: number
): Promise<SupplyExpense> => {
  const response = await api.get<SupplyExpense>(`/expenses/supply/${id}`);
  return response.data;
};

export const createSupplyExpense = async (
  data: CreateSupplyExpenseData
): Promise<SupplyExpense> => {
  const response = await api.post<SupplyExpense>("/expenses/supply", data);
  return response.data;
};

export const updateSupplyExpense = async (
  id: number,
  data: UpdateSupplyExpenseData
): Promise<SupplyExpense> => {
  const response = await api.put<SupplyExpense>(`/expenses/supply/${id}`, data);
  return response.data;
};

export const deleteSupplyExpense = async (id: number): Promise<void> => {
  await api.delete(`/expenses/supply/${id}`);
};

// Daily Expense API functions
export const getDailyExpenses = async (params?: {
  startDate?: string;
  endDate?: string;
  category?: string;
}): Promise<DailyExpense[]> => {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.append("startDate", params.startDate);
  if (params?.endDate) searchParams.append("endDate", params.endDate);
  if (params?.category) searchParams.append("category", params.category);
  const query = searchParams.toString();
  const response = await api.get<DailyExpense[]>(
    `/expenses/daily${query ? `?${query}` : ""}`
  );
  return response.data;
};

export const getDailyExpenseById = async (
  id: number
): Promise<DailyExpense> => {
  const response = await api.get<DailyExpense>(`/expenses/daily/${id}`);
  return response.data;
};

export const createDailyExpense = async (
  data: CreateDailyExpenseData
): Promise<DailyExpense> => {
  const response = await api.post<DailyExpense>("/expenses/daily", data);
  return response.data;
};

export const updateDailyExpense = async (
  id: number,
  data: UpdateDailyExpenseData
): Promise<DailyExpense> => {
  const response = await api.put<DailyExpense>(`/expenses/daily/${id}`, data);
  return response.data;
};

export const deleteDailyExpense = async (id: number): Promise<void> => {
  await api.delete(`/expenses/daily/${id}`);
};
