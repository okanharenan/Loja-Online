import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import ProductListingPage from "./pages/ProductListingPage";
import ProductViewPage from "./pages/ProductViewPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import AdminProductsPage from "./pages/AdminProductsPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/produtos" element={<ProductListingPage />} />
              <Route path="/produto/:idOrSlug" element={<ProductViewPage />} />
              <Route path="/entrar" element={<LoginPage />} />
              <Route path="/cadastro" element={<RegisterPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/carrinho" element={<CartPage />} />
                <Route path="/meus-pedidos" element={<OrdersPage />} />
              </Route>

              <Route element={<ProtectedRoute requireAdmin />}>
                <Route path="/admin/produtos" element={<AdminProductsPage />} />
              </Route>

              <Route path="*" element={<HomePage />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;