import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("../config/prisma.js", () => ({
  prisma: {
    user: { create: vi.fn(), findUnique: vi.fn() },
  },
}));

import { prisma } from "../config/prisma.js";
import { register, login } from "../controllers/authController.js";

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() };
}

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
});

describe("authController.login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recusa login com senha errada", async () => {
    const hashed = await bcrypt.hash("senha-certa", 10);
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@a.com",
      password: hashed,
      role: "USER",
    });

    const req = { body: { email: "a@a.com", password: "senha-errada" } };

    await expect(login(req, mockRes())).rejects.toThrow(/inválidos/);
  });

  it("recusa login para e-mail que não existe (sem revelar isso na mensagem)", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const req = { body: { email: "naoexiste@a.com", password: "qualquer" } };

    await expect(login(req, mockRes())).rejects.toThrow(/inválidos/);
  });

  it("autentica com a senha certa e nunca devolve o hash da senha", async () => {
    const hashed = await bcrypt.hash("senha-certa", 10);
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@a.com",
      password: hashed,
      role: "USER",
      name: "Ana",
    });

    const req = { body: { email: "a@a.com", password: "senha-certa" } };
    const res = mockRes();

    await login(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.user.password).toBeUndefined();
    expect(typeof payload.token).toBe("string");
  });
});

describe("authController.register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("nunca salva a senha em texto puro no banco", async () => {
    prisma.user.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: "u2", ...data })
    );

    const req = { body: { name: "Ana", email: "ana@a.com", password: "minhasenha123" } };
    const res = mockRes();

    await register(req, res);

    const savedData = prisma.user.create.mock.calls[0][0].data;
    expect(savedData.password).not.toBe("minhasenha123");

    const payload = res.json.mock.calls[0][0];
    expect(payload.user.password).toBeUndefined();
  });
});