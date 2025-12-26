"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type CartItem = {
  foodId: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  increase: (foodId: number) => void;
  decrease: (foodId: number) => void;
  totalQuantity: number;
  totalPrice: number;
  removeItem: (foodId: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const found = prev.find((i) => i.foodId === item.foodId);
      if (found) {
        return prev.map((i) =>
          i.foodId === item.foodId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const increase = (foodId: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.foodId === foodId ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  };

  const decrease = (foodId: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.foodId === foodId
            ? { ...i, quantity: Math.max(1, i.quantity - 1) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (foodId: number) => {
    setItems((prev) => prev.filter((i) => i.foodId !== foodId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.quantity * i.price, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        increase,
        decrease,
        totalQuantity,
        totalPrice,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
