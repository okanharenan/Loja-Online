import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma.js", () => ({
  prisma: {
    order: { findUnique: vi.fn(), update: vi.fn() },
    product: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("../utils/mercadoPago.js", () => ({
  createPaymentPreference: vi.fn(),
  getPayment: vi.fn(),
}));

import { prisma } from "../config/prisma.js";
import { createPaymentPreference, getPayment } from "../utils/mercadoPago.js";
import { createOrderPayment, handlePaymentWebhook } from "../controllers/paymentController.js";

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn(), sendStatus: vi.fn() };
}

describe("paymentController.createOrderPayment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recusa gerar pagamento pra pedido de outro usuário", async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: "o1",
      userId: "dono",
      status: "PENDING",
      items: [],
    });

    const req = { params: { id: "o1" }, user: { id: "u1", role: "USER" } };

    await expect(createOrderPayment(req, mockRes())).rejects.toThrow(/Acesso negado/);
  });

  it("recusa gerar pagamento pra pedido que já não está mais pendente", async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: "o1",
      userId: "u1",
      status: "PAID",
      items: [],
    });

    const req = { params: { id: "o1" }, user: { id: "u1", role: "USER" } };

    await expect(createOrderPayment(req, mockRes())).rejects.toThrow(
      /não está mais aguardando pagamento/,
    );
  });

  it("reaproveita o link de pagamento já existente, sem criar preferência de novo", async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: "o1",
      userId: "u1",
      status: "PENDING",
      mpInitPoint: "https://mp.example/checkout/ja-existente",
      items: [],
    });

    const req = { params: { id: "o1" }, user: { id: "u1", role: "USER" } };
    const res = mockRes();

    await createOrderPayment(req, res);

    expect(createPaymentPreference).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      checkoutUrl: "https://mp.example/checkout/ja-existente",
    });
  });

  it("cria uma preferência nova quando o pedido ainda não tem uma", async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: "o1",
      userId: "u1",
      status: "PENDING",
      mpInitPoint: null,
      items: [{ productId: "p1", quantity: 1, price: 100, product: { name: "Tênis X" } }],
    });
    createPaymentPreference.mockResolvedValue({
      preferenceId: "pref-1",
      initPoint: "https://mp.example/checkout/novo",
    });

    const req = { params: { id: "o1" }, user: { id: "u1", role: "USER" } };
    const res = mockRes();

    await createOrderPayment(req, res);

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { mpPreferenceId: "pref-1", mpInitPoint: "https://mp.example/checkout/novo" },
      }),
    );
    expect(res.json).toHaveBeenCalledWith({ checkoutUrl: "https://mp.example/checkout/novo" });
  });
});

describe("paymentController.handlePaymentWebhook", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marca o pedido como PAID quando o pagamento é aprovado", async () => {
    getPayment.mockResolvedValue({ id: 999, status: "approved", external_reference: "o1" });
    prisma.order.findUnique.mockResolvedValue({ id: "o1", status: "PENDING", items: [] });

    const req = { query: { topic: "payment", id: "999" }, body: {} };
    const res = mockRes();

    await handlePaymentWebhook(req, res);

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "PAID", mpPaymentId: "999" } }),
    );
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it("cancela o pedido e devolve o estoque quando o pagamento é recusado", async () => {
    getPayment.mockResolvedValue({ id: 999, status: "rejected", external_reference: "o1" });
    prisma.order.findUnique.mockResolvedValue({
      id: "o1",
      status: "PENDING",
      items: [{ productId: "p1", quantity: 2 }],
    });
    prisma.$transaction.mockResolvedValue([{}, {}]);

    const req = { query: { topic: "payment", id: "999" }, body: {} };
    const res = mockRes();

    await handlePaymentWebhook(req, res);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it("é idempotente — não faz nada se o pedido já está num estado final", async () => {
    getPayment.mockResolvedValue({ id: 999, status: "approved", external_reference: "o1" });
    prisma.order.findUnique.mockResolvedValue({ id: "o1", status: "PAID", items: [] });

    const req = { query: { topic: "payment", id: "999" }, body: {} };
    const res = mockRes();

    await handlePaymentWebhook(req, res);

    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it("ignora notificações que não são de pagamento", async () => {
    const req = { query: { topic: "merchant_order", id: "123" }, body: {} };
    const res = mockRes();

    await handlePaymentWebhook(req, res);

    expect(getPayment).not.toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });
});