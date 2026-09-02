import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";

// Protege rotas exigindo um token JWT válido no header Authorization.
// Uso: router.get("/rota-protegida", requireAuth, handler)
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Token de autenticação não fornecido", 401);
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload contém { id, role } definidos na criação do token
    req.user = payload;
    next();
  } catch {
    throw new AppError("Token inválido ou expirado", 401);
  }
}

// Restringe a rota a usuários com role ADMIN.
// Deve ser usado sempre depois de requireAuth.
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    throw new AppError("Acesso restrito a administradores", 403);
  }
  next();
}
