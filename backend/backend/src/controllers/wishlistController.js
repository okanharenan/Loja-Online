import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

const addWishlistItemSchema = z.object({
  productId: z.string().uuid(),
});

// GET /api/wishlist — lista de desejos do usuário logado
export async function getWishlist(req, res) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  res.json({ items });
}

// POST /api/wishlist — adiciona um produto (idempotente: adicionar de novo
// o mesmo produto não duplica nem dá erro, graças ao @@unique do schema)
export async function addWishlistItem(req, res) {
  const data = addWishlistItemSchema.parse(req.body);

  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  });

  if (!product || !product.active) {
    throw new AppError("Produto não encontrado", 404);
  }

  const item = await prisma.wishlistItem.upsert({
    where: {
      userId_productId: { userId: req.user.id, productId: data.productId },
    },
    update: {},
    create: { userId: req.user.id, productId: data.productId },
    include: { product: true },
  });

  res.status(201).json({ item });
}

// DELETE /api/wishlist/:productId
export async function removeWishlistItem(req, res) {
  const { productId } = req.params;

  await prisma.wishlistItem.deleteMany({
    where: { userId: req.user.id, productId },
  });

  res.status(204).send();
}