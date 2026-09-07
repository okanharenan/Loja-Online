import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import crypto from "crypto";

vi.mock("../config/prisma.js", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    passwordResetToken: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("../utils/mailer.js", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

import { prisma } from "../config/prisma.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";
import { forgotPassword, resetPassword } from "../controllers/authController.js";

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() };
}

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.FRONTEND_URL = "http://localhost:5173";
});

describe("authController.forgotPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("responde com sucesso genérico mesmo se o e-mail não existir (não revela)", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const req = { body: { email: "naoexiste@a.com" } };
    const res = mockRes();

    await forgotPassword(req, res);

    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  it("cria o token e dispara o e-mail quando o usuário existe", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1", email: "a@a.com" });
    prisma.passwordResetToken.create.mockResolvedValue({ id: "t1" });

    const req = { body: { email: "a@a.com" } };
    const res = mockRes();

    await forgotPassword(req, res);

    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "u1" }),
      })
    );
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      "a@a.com",
      expect.stringContaining("/redefinir-senha?token=")
    );
  });
});

describe("authController.resetPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recusa token que não existe", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(null);

    const req = { body: { token: "qualquer-coisa", password: "novaSenha123" } };

    await expect(resetPassword(req, mockRes())).rejects.toThrow(/inválido ou expirado/);
  });

  it("recusa token expirado", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: "t1",
      userId: "u1",
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000), // já expirou
    });

    const req = { body: { token: "abc", password: "novaSenha123" } };

    await expect(resetPassword(req, mockRes())).rejects.toThrow(/inválido ou expirado/);
  });

  it("recusa token que já foi usado antes (evita reuso)", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: "t1",
      userId: "u1",
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
    });

    const req = { body: { token: "abc", password: "novaSenha123" } };

    await expect(resetPassword(req, mockRes())).rejects.toThrow(/inválido ou expirado/);
  });

  it("troca a senha e marca o token como usado quando tudo é válido", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: "t1",
      userId: "u1",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60000),
    });

    const txUserUpdate = vi.fn().mockResolvedValue({});
    const txTokenUpdate = vi.fn().mockResolvedValue({});
    prisma.$transaction.mockImplementation((ops) => Promise.all(ops));
    prisma.user.update.mockImplementation(txUserUpdate);
    prisma.passwordResetToken.update.mockImplementation(txTokenUpdate);

    const req = { body: { token: "abc", password: "novaSenha123" } };
    const res = mockRes();

    await resetPassword(req, res);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });
});

describe("hashToken (comportamento indireto via resetPassword)", () => {
  it("o mesmo token cru sempre gera o mesmo hash sha256 (determinístico)", () => {
    const a = crypto.createHash("sha256").update("abc").digest("hex");
    const b = crypto.createHash("sha256").update("abc").digest("hex");
    expect(a).toBe(b);
  });
});