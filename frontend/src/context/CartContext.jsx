import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { cartApi } from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const data = await cartApi.get();
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (productId, quantity = 1, size, color) => {
      if (!user) {
        const err = new Error("Você precisa entrar para adicionar itens ao carrinho");
        err.code = "NOT_AUTHENTICATED";
        throw err;
      }
      await cartApi.addItem({ productId, quantity, size, color });
      await refresh();
    },
    [user, refresh]
  );

  const updateItem = useCallback(
    async (itemId, quantity) => {
      await cartApi.updateItem(itemId, quantity);
      await refresh();
    },
    [refresh]
  );

  const removeItem = useCallback(
    async (itemId) => {
      await cartApi.removeItem(itemId);
      await refresh();
    },
    [refresh]
  );

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, total, count, loading, addItem, updateItem, removeItem, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}
