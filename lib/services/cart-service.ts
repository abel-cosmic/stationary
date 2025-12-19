import type { CartItem, SelectedProduct } from "@/types/quick-sell";
import type { Product } from "@/types/api";

export interface CartTotals {
  totalRevenue: number;
  totalProfit: number;
  totalQuantity: number;
}

/**
 * Calculate cart totals (revenue, profit, quantity)
 */
export function calculateCartTotals(cart: CartItem[]): CartTotals {
  const totalRevenue = cart.reduce(
    (sum, item) => sum + item.amount * item.soldPrice,
    0
  );

  const totalProfit = cart.reduce((sum, item) => {
    const initialCost = item.product.initialPrice * item.amount;
    const revenue = item.amount * item.soldPrice;
    return sum + (revenue - initialCost);
  }, 0);

  const totalQuantity = cart.reduce((sum, item) => sum + item.amount, 0);

  return { totalRevenue, totalProfit, totalQuantity };
}

/**
 * Validate if a product can be added to cart
 */
export function canAddToCart(
  product: Product,
  amount: number,
  soldPrice: number
): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: "Amount must be greater than 0" };
  }

  if (amount > product.quantity) {
    return { valid: false, error: "Insufficient quantity available" };
  }

  if (soldPrice <= 0) {
    return { valid: false, error: "Selling price must be greater than 0" };
  }

  return { valid: true };
}

/**
 * Create cart items from selected products
 */
export function createCartItemsFromSelected(
  selectedProducts: Map<number, SelectedProduct>,
  products: Product[]
): CartItem[] {
  const cartItems: CartItem[] = [];

  selectedProducts.forEach((selected, productId) => {
    const product = products.find((p) => p.id === productId);
    if (product && selected.amount > 0 && selected.soldPrice > 0) {
      cartItems.push({
        productId,
        product,
        amount: selected.amount,
        soldPrice: selected.soldPrice,
      });
    }
  });

  return cartItems;
}
