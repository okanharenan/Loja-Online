import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma.js", () => ({
  prisma: {
    product: { findUnique: vi.fn() },
    cartItem: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "../config/prisma.js";
import { addItem, updateItem } from "../controllers/cartController.js";
import { AppError } from "../utils/AppError.js";

const PRODUCT_ID = "11111111-1111-1111-1111-111111111111";

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn(), send: vi.fn() };
}

describe("cartController.addItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("bloqueia quando a quantidade pedida excede o estoque de um item novo", async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: "p1",
      active: true,
      stock: 3,
      name: "Tênis X",
    });
    prisma.cartItem.findUnique.mockResolvedValue(null);

    const req = {
      user: { id: "u1" },
      body: { productId: PRODUCT_ID, quantity: 5 },
    };

    await expect(addItem(req, mockRes())).rejects.toThrow(AppError);
    expect(prisma.cartItem.upsert).not.toHaveBeenCalled();
  });

  it("soma a quantidade já existente no carrinho antes de checar o estoque", async () => {
    // já tem 4 no carrinho + pedindo mais 2 = 6, estoque só tem 5
    prisma.product.findUnique.mockResolvedValue({
      id: "p1",
      active: true,
      stock: 5,
      name: "Tênis X",
    });
    prisma.cartItem.findUnique.mockResolvedValue({ quantity: 4 });

    const req = {
      user: { id: "u1" },
      body: { productId: PRODUCT_ID, quantity: 2 },
    };

    await expect(addItem(req, mockRes())).rejects.toThrow(/Estoque insuficiente/);
  });

  it("permite adicionar quando a quantidade final está dentro do estoque", async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: "p1",
      active: true,
      stock: 10,
      name: "Tênis X",
    });
    prisma.cartItem.findUnique.mockResolvedValue(null);
    prisma.cartItem.upsert.mockResolvedValue({ id: "item1", quantity: 3 });

    const req = {
      user: { id: "u1" },
      body: { productId: PRODUCT_ID, quantity: 3 },
    };
    const res = mockRes();

    await addItem(req, res);

    expect(prisma.cartItem.upsert).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("recusa produto inativo ou inexistente", async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    const req = {
      user: { id: "u1" },
      body: { productId: PRODUCT_ID, quantity: 1 },
    };

    await expect(addItem(req, mockRes())).rejects.toThrow(/não encontrado/);
  });
});

describe("cartController.updateItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("bloqueia atualizar para uma quantidade maior que o estoque do produto", async () => {
    prisma.cartItem.findUnique.mockResolvedValue({
      id: "item1",
      userId: "u1",
      product: { stock: 2, name: "Tênis X" },
    });

    const req = {
      user: { id: "u1" },
      params: { itemId: "item1" },
      body: { quantity: 5 },
    };

    await expect(updateItem(req, mockRes())).rejects.toThrow(/Estoque insuficiente/);
    expect(prisma.cartItem.update).not.toHaveBeenCalled();
  });

  it("recusa mexer no item de carrinho de outro usuário", async () => {
    prisma.cartItem.findUnique.mockResolvedValue({
      id: "item1",
      userId: "outro-usuario",
      product: { stock: 10 },
    });

    const req = {
      user: { id: "u1" },
      params: { itemId: "item1" },
      body: { quantity: 1 },
    };

    await expect(updateItem(req, mockRes())).rejects.toThrow(/não encontrado/);
  });
});