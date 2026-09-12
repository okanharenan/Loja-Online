import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import ProductListingPage from "./pages/ProductListingPage";
import ProductViewPage from "./pages/ProductViewPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import PaymentReturnPage from "./pages/PaymentReturnPage";
import WishlistPage from "./pages/WishlistPage";
import AdminProductsPage from "./pages/AdminProductsPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/produtos" element={<ProductListingPage />} />
                <Route path="/produto/:idOrSlug" element={<ProductViewPage />} />
                <Route path="/entrar" element={<LoginPage />} />
                <Route path="/cadastro" element={<RegisterPage />} />
                <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
                <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/carrinho" element={<CartPage />} />
                  <Route path="/meus-pedidos" element={<OrdersPage />} />
                  <Route path="/favoritos" element={<WishlistPage />} />
                  <Route path="/pedido/retorno" element={<PaymentReturnPage />} />
                </Route>

                <Route element={<ProtectedRoute requireAdmin />}>
                  <Route path="/admin/produtos" element={<AdminProductsPage />} />
                </Route>

                <Route path="*" element={<HomePage />} />
              </Route>
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;