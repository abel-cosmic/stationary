// Quick sell page specific types
import type { Product } from "./api";

export type SalesTab = "today" | "weekly" | "allTime";

export interface CartItem {
  productId: number;
  product: Product;
  amount: number;
  soldPrice: number;
}

export interface SelectedProduct {
  productId: number;
  amount: number;
  soldPrice: number;
}
