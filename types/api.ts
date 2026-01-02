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

export interface Service {
  id: number;
  name: string;
  defaultPrice: number;
  description?: string | null;
  totalSold: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
  sellHistory?: SellHistory[];
  _count?: {
    sellHistory: number;
  };
}

export interface SellHistory {
  id: number;
  productId?: number | null;
  serviceId?: number | null;
  amount: number;
  soldPrice: number;
  totalPrice: number;
  initialPrice?: number | null; // Price at time of sale (null for services)
  transactionId?: number | null;
  createdAt: string;
  product?: Product; // Included when fetched with relations
  service?: Service; // Included when fetched with relations
  transaction?: Transaction; // Included when fetched with relations
  debitItem?: DebitItem; // Included when fetched with relations
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

export interface CreateServiceData {
  name: string;
  defaultPrice: number;
  description?: string | null;
}

export interface UpdateServiceData {
  name?: string;
  defaultPrice?: number;
  description?: string | null;
}

export interface SellServiceData {
  amount: number;
  soldPrice: number;
}

export type DebitStatus = "PENDING" | "PARTIAL" | "PAID";

export interface Debit {
  id: number;
  totalAmount: number;
  paidAmount: number;
  status: DebitStatus;
  customerName?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt?: string | null;
  debitItems?: DebitItem[];
}

export interface DebitItem {
  id: number;
  debitId: number;
  sellHistoryId: number;
  amount: number;
  createdAt: string;
  debit?: Debit;
  sellHistory?: SellHistory;
}

export interface CreateDebitData {
  customerName?: string | null;
  notes?: string | null;
  debitItems: Array<{
    sellHistoryId: number;
    amount: number;
  }>;
}

export interface UpdateDebitData {
  customerName?: string | null;
  notes?: string | null;
  paidAmount?: number;
}

export interface PayDebitData {
  amount: number;
}

export interface UpdateSellHistoryData {
  amount?: number;
  soldPrice?: number;
  createdAt?: string;
}

export interface SupplyExpense {
  id: number;
  description: string;
  amount: number;
  supplier?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplyExpenseData {
  description: string;
  amount: number;
  supplier?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  notes?: string | null;
}

export interface UpdateSupplyExpenseData {
  description?: string;
  amount?: number;
  supplier?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  notes?: string | null;
}

export interface DailyExpense {
  id: number;
  description: string;
  amount: number;
  category?: string | null;
  notes?: string | null;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyExpenseData {
  description: string;
  amount: number;
  category?: string | null;
  notes?: string | null;
  expenseDate?: string;
}

export interface UpdateDailyExpenseData {
  description?: string;
  amount?: number;
  category?: string | null;
  notes?: string | null;
  expenseDate?: string;
}
