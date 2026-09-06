import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma.js", () => ({
  prisma: {
    cartItem: { findMany: vi.fn() },
    order: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "../config/prisma.js";
import { createOrder, getOrder } from "../controllers/orderController.js";

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() };
}

describe("orderController.createOrder", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recusa fechar pedido com carrinho vazio", async () => {
    prisma.cartItem.findMany.mockResolvedValue([]);

    const req = { user: { id: "u1" } };

    await expect(createOrder(req, mockRes())).rejects.toThrow(/vazio/);
  });

  it("recusa fechar pedido se algum item não tem estoque suficiente", async () => {
    prisma.cartItem.findMany.mockResolvedValue([
      {
        productId: "p1",
        quantity: 5,
        product: { id: "p1", name: "Tênis X", stock: 2, price: 100 },
      },
    ]);

    const req = { user: { id: "u1" } };

    await expect(createOrder(req, mockRes())).rejects.toThrow(/Estoque insuficiente/);
  });

  it("calcula o total certo, abate o estoque de cada item e limpa o carrinho", async () => {
    const cartItems = [
      {
        productId: "p1",
        quantity: 2,
        size: "42",
        color: "black",
        product: { id: "p1", name: "Tênis X", stock: 10, price: 100 },
      },
      {
        productId: "p2",
        quantity: 1,
        size: null,
        color: null,
        product: { id: "p2", name: "Tênis Y", stock: 5, price: 50 },
      },
    ];
    prisma.cartItem.findMany.mockResolvedValue(cartItems);

    const txOrderCreate = vi.fn().mockResolvedValue({ id: "order1", items: [] });
    const txProductUpdate = vi.fn().mockResolvedValue({});
    const txCartDeleteMany = vi.fn().mockResolvedValue({});

    prisma.$transaction.mockImplementation((callback) =>
      callback({
        order: { create: txOrderCreate },
        product: { update: txProductUpdate },
        cartItem: { deleteMany: txCartDeleteMany },
      })
    );

    const req = { user: { id: "u1" } };
    const res = mockRes();

    await createOrder(req, res);

    // total = 2 * 100 + 1 * 50 = 250
    expect(txOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ total: 250 }) })
    );
    expect(txProductUpdate).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { stock: { decrement: 2 } },
    });
    expect(txProductUpdate).toHaveBeenCalledWith({
      where: { id: "p2" },
      data: { stock: { decrement: 1 } },
    });
    expect(txCartDeleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("orderController.getOrder", () => {
  beforeEach(() => vi.clearAllMocks());

  it("bloqueia acesso ao pedido de outro usuário que não é admin", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: "o1", userId: "dono", items: [] });

    const req = { user: { id: "u1", role: "USER" }, params: { id: "o1" } };

    await expect(getOrder(req, mockRes())).rejects.toThrow(/Acesso negado/);
  });

  it("permite acesso de admin ao pedido de qualquer usuário", async () => {
    const order = { id: "o1", userId: "dono", items: [] };
    prisma.order.findUnique.mockResolvedValue(order);

    const req = { user: { id: "u1", role: "ADMIN" }, params: { id: "o1" } };
    const res = mockRes();

    await getOrder(req, res);

    expect(res.json).toHaveBeenCalledWith({ order });
  });

  it("retorna 404 quando o pedido não existe", async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    const req = { user: { id: "u1", role: "USER" }, params: { id: "inexistente" } };

    await expect(getOrder(req, mockRes())).rejects.toThrow(/não encontrado/);
  });
});