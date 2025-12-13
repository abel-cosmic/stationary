// API-related types
export interface Category {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: number;
  name: string;
  initialPrice: number;
  sellingPrice: number;
  quantity: number;
  totalSold: number;
  revenue: number;
  profit: number;
  categoryId?: number | null;
  category?: Category | null;
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
  initialPrice: number; // Price at time of sale
  transactionId?: number | null;
  createdAt: string;
  product?: Product; // Included when fetched with relations
}

export interface CreateProductData {
  name: string;
  initialPrice: number;
  sellingPrice: number;
  quantity: number;
  categoryId?: number | null;
}

export interface UpdateProductData {
  name?: string;
  initialPrice?: number;
  sellingPrice?: number;
  quantity?: number;
  categoryId?: number | null;
}

export interface SellProductData {
  amount: number;
  soldPrice: number;
}

export interface Transaction {
  id: number;
  totalRevenue: number;
  totalProfit: number;
  createdAt: string;
  sellHistory?: SellHistory[];
}

export interface BulkSellItem {
  productId: number;
  amount: number;
  soldPrice: number;
}

export interface BulkSellRequest {
  items: BulkSellItem[];
}

export interface CreateCategoryData {
  name: string;
}

export interface UpdateCategoryData {
  name: string;
}
