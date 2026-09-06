import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma.js", () => ({
  prisma: {
    product: { findUnique: vi.fn() },
    wishlistItem: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  },
}));

import { prisma } from "../config/prisma.js";
import {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
} from "../controllers/wishlistController.js";

const PRODUCT_ID = "11111111-1111-1111-1111-111111111111";

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn(), send: vi.fn() };
}

describe("wishlistController.addWishlistItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recusa produto inexistente ou inativo", async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    const req = { user: { id: "u1" }, body: { productId: PRODUCT_ID } };

    await expect(addWishlistItem(req, mockRes())).rejects.toThrow(/não encontrado/);
    expect(prisma.wishlistItem.upsert).not.toHaveBeenCalled();
  });

  it("adiciona o produto à wishlist do usuário logado", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: PRODUCT_ID, active: true });
    prisma.wishlistItem.upsert.mockResolvedValue({ id: "w1", productId: PRODUCT_ID });

    const req = { user: { id: "u1" }, body: { productId: PRODUCT_ID } };
    const res = mockRes();

    await addWishlistItem(req, res);

    expect(prisma.wishlistItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_productId: { userId: "u1", productId: PRODUCT_ID } },
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("adicionar o mesmo produto duas vezes não duplica (upsert é idempotente)", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: PRODUCT_ID, active: true });
    prisma.wishlistItem.upsert.mockResolvedValue({ id: "w1", productId: PRODUCT_ID });

    const req = { user: { id: "u1" }, body: { productId: PRODUCT_ID } };

    await addWishlistItem(req, mockRes());
    await addWishlistItem(req, mockRes());

    expect(prisma.wishlistItem.upsert).toHaveBeenCalledTimes(2);
    // a chamada real ao banco é upsert (create-or-nothing), não create puro —
    // é isso que garante que não gera erro de unique constraint duplicado
  });
});

describe("wishlistController.getWishlist / removeWishlistItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista só os itens do usuário logado", async () => {
    prisma.wishlistItem.findMany.mockResolvedValue([{ id: "w1", productId: PRODUCT_ID }]);

    const req = { user: { id: "u1" } };
    const res = mockRes();

    await getWishlist(req, res);

    expect(prisma.wishlistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u1" } })
    );
    expect(res.json).toHaveBeenCalledWith({ items: [{ id: "w1", productId: PRODUCT_ID }] });
  });

  it("remove só o item do próprio usuário (nunca de outro)", async () => {
    prisma.wishlistItem.deleteMany.mockResolvedValue({ count: 1 });

    const req = { user: { id: "u1" }, params: { productId: PRODUCT_ID } };
    const res = mockRes();

    await removeWishlistItem(req, res);

    expect(prisma.wishlistItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1", productId: PRODUCT_ID },
    });
    expect(res.status).toHaveBeenCalledWith(204);
  });
});