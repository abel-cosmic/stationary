import { create } from "zustand";
import type { CartItem, SelectedProduct, SalesTab } from "@/types/quick-sell";

interface QuickSellState {
  cart: CartItem[];
  selectedProducts: Map<number, SelectedProduct>;
  activeTab: SalesTab;
  isExportingDaily: boolean;
  isGeneratingReport: boolean;
}

interface QuickSellActions {
  // Cart actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  updateCartItem: (productId: number, updates: Partial<CartItem>) => void;

  // Selected products actions
  toggleProductSelection: (productId: number) => void;
  updateSelectedProduct: (
    productId: number,
    field: "amount" | "soldPrice",
    value: number
  ) => void;
  clearSelectedProducts: () => void;
  setSelectedProducts: (products: Map<number, SelectedProduct>) => void;

  // Tab actions
  setActiveTab: (tab: SalesTab) => void;

  // Export actions
  setExportingDaily: (isExporting: boolean) => void;
  setGeneratingReport: (isGenerating: boolean) => void;

  // Reset all state
  reset: () => void;
}

const initialState: QuickSellState = {
  cart: [],
  selectedProducts: new Map(),
  activeTab: "today",
  isExportingDaily: false,
  isGeneratingReport: false,
};

export const useQuickSellStore = create<QuickSellState & QuickSellActions>(
  (set) => ({
    ...initialState,

    addToCart: (item) =>
      set((state) => {
        const existingIndex = state.cart.findIndex(
          (cartItem) => cartItem.productId === item.productId
        );

        if (existingIndex >= 0) {
          // Update existing item
          const updatedCart = [...state.cart];
          updatedCart[existingIndex] = {
            ...updatedCart[existingIndex],
            ...item,
          };
          return { cart: updatedCart };
        } else {
          // Add new item
          return { cart: [...state.cart, item] };
        }
      }),

    removeFromCart: (productId) =>
      set((state) => ({
        cart: state.cart.filter((item) => item.productId !== productId),
      })),

    clearCart: () => set({ cart: [] }),

    updateCartItem: (productId, updates) =>
      set((state) => ({
        cart: state.cart.map((item) =>
          item.productId === productId ? { ...item, ...updates } : item
        ),
      })),

    toggleProductSelection: (productId) =>
      set((state) => {
        const newSelected = new Map(state.selectedProducts);
        if (newSelected.has(productId)) {
          newSelected.delete(productId);
        } else {
          // Default values will be set by the component
          newSelected.set(productId, {
            productId,
            amount: 1,
            soldPrice: 0,
          });
        }
        return { selectedProducts: newSelected };
      }),

    updateSelectedProduct: (productId, field, value) =>
      set((state) => {
        const newSelected = new Map(state.selectedProducts);
        const current = newSelected.get(productId);
        if (current) {
          newSelected.set(productId, {
            ...current,
            [field]: value,
          });
        }
        return { selectedProducts: newSelected };
      }),

    clearSelectedProducts: () => set({ selectedProducts: new Map() }),

    setSelectedProducts: (products) => set({ selectedProducts: products }),

    setActiveTab: (tab) => set({ activeTab: tab }),

    setExportingDaily: (isExporting) => set({ isExportingDaily: isExporting }),

    setGeneratingReport: (isGenerating) =>
      set({ isGeneratingReport: isGenerating }),

    reset: () => set(initialState),
  })
);
