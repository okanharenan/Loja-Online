import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { wishlistApi } from "../services/api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await wishlistApi.list();
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const productIds = new Set(items.map((item) => item.productId));

  function isWishlisted(productId) {
    return productIds.has(productId);
  }

  // Alterna favorito com atualização otimista da UI — o coração muda na
  // hora, sem esperar a resposta do servidor, e desfaz se a chamada falhar.
  const toggle = useCallback(
    async (productId) => {
      if (!user) {
        const err = new Error("Você precisa entrar para favoritar produtos");
        err.code = "NOT_AUTHENTICATED";
        throw err;
      }

      const wasWishlisted = productIds.has(productId);

      if (wasWishlisted) {
        setItems((prev) => prev.filter((item) => item.productId !== productId));
        try {
          await wishlistApi.remove(productId);
        } catch (err) {
          await refresh();
          throw err;
        }
      } else {
        setItems((prev) => [...prev, { productId }]);
        try {
          await wishlistApi.add(productId);
        } catch (err) {
          await refresh();
          throw err;
        }
      }
    },
    [user, productIds, refresh]
  );

  return (
    <WishlistContext.Provider
      value={{ items, loading, isWishlisted, toggle, refresh, count: items.length }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist precisa estar dentro de <WishlistProvider>");
  return ctx;
}