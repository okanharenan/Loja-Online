import { PrismaClient } from "@prisma/client";

// Reaproveita a instância do Prisma Client em toda a aplicação,
// evitando abrir múltiplas conexões com o banco.
export const prisma = new PrismaClient();
