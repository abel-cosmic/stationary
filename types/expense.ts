// Expense-related types

export interface SupplyExpenseFormData {
  description: string;
  amount: number;
  supplier?: string;
  quantity?: number;
  unitPrice?: number;
  notes?: string;
}

export interface DailyExpenseFormData {
  description: string;
  amount: number;
  category?: string;
  notes?: string;
  expenseDate?: string;
}

export type ExpenseCategory =
  | "Utilities"
  | "Rent"
  | "Transportation"
  | "Office Supplies"
  | "Maintenance"
  | "Other";

