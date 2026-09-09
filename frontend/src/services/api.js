import { withCache, invalidateCache } from "../utils/apiCache";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 No Content não tem corpo pra parsear
  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // O backend padroniza erros como { error: "mensagem" } ou { error, issues: [...] }
    const message = data?.error || "Erro inesperado ao falar com o servidor";
    const err = new Error(message);
    err.status = response.status;
    err.issues = data?.issues;
    throw err;
  }

  return data;
}

// ---- Produtos ----
export const productsApi = {
  list(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) params.set(key, value.join(","));
        return;
      }
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, value);
      }
    });
    const query = params.toString();
    const path = `/api/products${query ? `?${query}` : ""}`;
    return withCache(path, () => request(path));
  },
  get(idOrSlug) {
    const path = `/api/products/${idOrSlug}`;
    return withCache(path, () => request(path));
  },
  create(data) {
    return request("/api/products", { method: "POST", body: data, auth: true }).then(
      (res) => {
        invalidateCache("/api/products");
        return res;
      },
    );
  },
  update(id, data) {
    return request(`/api/products/${id}`, { method: "PUT", body: data, auth: true }).then(
      (res) => {
        invalidateCache("/api/products");
        return res;
      },
    );
  },
  remove(id) {
    return request(`/api/products/${id}`, { method: "DELETE", auth: true }).then((res) => {
      invalidateCache("/api/products");
      return res;
    });
  },
};

// ---- Autenticação ----
export const authApi = {
  register(data) {
    return request("/api/auth/register", { method: "POST", body: data });
  },
  login(data) {
    return request("/api/auth/login", { method: "POST", body: data });
  },
  me() {
    return request("/api/auth/me", { auth: true });
  },
  forgotPassword(email) {
    return request("/api/auth/forgot-password", { method: "POST", body: { email } });
  },
  resetPassword(token, password) {
    return request("/api/auth/reset-password", { method: "POST", body: { token, password } });
  },
};

// ---- Carrinho ----
export const cartApi = {
  get() {
    return request("/api/cart", { auth: true });
  },
  addItem(data) {
    return request("/api/cart", { method: "POST", body: data, auth: true });
  },
  updateItem(itemId, quantity) {
    return request(`/api/cart/${itemId}`, {
      method: "PUT",
      body: { quantity },
      auth: true,
    });
  },
  removeItem(itemId) {
    return request(`/api/cart/${itemId}`, { method: "DELETE", auth: true });
  },
};

// ---- Pedidos ----
export const ordersApi = {
  create() {
    return request("/api/orders", { method: "POST", auth: true });
  },
  list() {
    return request("/api/orders", { auth: true });
  },
  get(id) {
    return request(`/api/orders/${id}`, { auth: true });
  },
};

// ---- Lista de desejos ----
export const wishlistApi = {
  list() {
    return request("/api/wishlist", { auth: true });
  },
  add(productId) {
    return request("/api/wishlist", { method: "POST", body: { productId }, auth: true });
  },
  remove(productId) {
    return request(`/api/wishlist/${productId}`, { method: "DELETE", auth: true });
  },
};

export { getToken };