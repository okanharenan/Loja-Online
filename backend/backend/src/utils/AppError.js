// Erro customizado para respostas previsíveis da API.
// Uso: throw new AppError("Produto não encontrado", 404)
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}
