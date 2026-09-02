import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Bloqueia rotas que exigem login (carrinho, pedidos) e manda pra tela de
// entrar, lembrando de onde o usuário veio pra redirecionar de volta depois.
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/entrar" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
