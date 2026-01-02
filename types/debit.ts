// Debit-related types
export type DebitStatus = "PENDING" | "PARTIAL" | "PAID";

export interface DebitFormData {
  customerName?: string;
  notes?: string;
  debitItems: Array<{
    sellHistoryId: number;
    amount: number;
  }>;
}

export interface PayDebitFormData {
  amount: number;
}

