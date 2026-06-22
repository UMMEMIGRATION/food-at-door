import { create } from "zustand";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  description: string;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: typeof window !== "undefined" ? JSON.parse(localStorage.getItem("fad_cart_items") || "[]") : [],
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      let newItems;
      if (existing) {
        newItems = state.items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        newItems = [...state.items, { ...item, quantity: 1 }];
      }
      localStorage.setItem("fad_cart_items", JSON.stringify(newItems));
      localStorage.removeItem("fad_cart_cleared");
      return { items: newItems };
    }),
  removeItem: (id) =>
    set((state) => {
      const newItems = state.items.filter((i) => i.id !== id);
      localStorage.setItem("fad_cart_items", JSON.stringify(newItems));
      return { items: newItems };
    }),
  updateQuantity: (id, quantity) =>
    set((state) => {
      const newItems = state.items
        .map((i) => (i.id === id ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0);
      localStorage.setItem("fad_cart_items", JSON.stringify(newItems));
      return { items: newItems };
    }),
  clearCart: () =>
    set(() => {
      localStorage.setItem("fad_cart_items", "[]");
      localStorage.setItem("fad_cart_cleared", "true");
      return { items: [] };
    }),
}));
