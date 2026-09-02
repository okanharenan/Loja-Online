import { AppError } from "../utils/AppError.js";
import { ZodError } from "zod";

// Middleware final da cadeia — captura qualquer erro lançado nas rotas
// e transforma em uma resposta JSON consistente.
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      error: "Dados inválidos",
      issues: err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  // Erro de constraint única do Prisma (ex: e-mail duplicado)
  if (err.code === "P2002") {
    return res.status(409).json({
      error: `Já existe um registro com esse ${err.meta?.target?.join(", ")}`,
    });
  }

  console.error(err);
  return res.status(500).json({ error: "Erro interno do servidor" });
}

// Wrapper para não precisar de try/catch em toda rota async
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
