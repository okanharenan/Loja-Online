import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

const addItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  size: z.string().optional(),
  color: z.string().optional(),
});

const updateItemSchema = z.object({
  quantity: z.number().int().positive(),
});

// GET /api/cart — carrinho do usuário logado
export async function getCart(req, res) {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  res.json({ items, total });
}

// POST /api/cart — adiciona item (ou soma quantidade se já existir igual)
export async function addItem(req, res) {
  const data = addItemSchema.parse(req.body);

  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  });

  if (!product || !product.active) {
    throw new AppError("Produto não encontrado", 404);
  }

  // Se já existe um item igual no carrinho, a quantidade final é a soma —
  // então o limite de estoque precisa considerar o que já está lá, não só
  // o incremento que está chegando agora.
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      userId_productId_size_color: {
        userId: req.user.id,
        productId: data.productId,
        size: data.size ?? null,
        color: data.color ?? null,
      },
    },
  });

  const finalQuantity = (existingItem?.quantity ?? 0) + data.quantity;

  if (finalQuantity > product.stock) {
    throw new AppError(
      `Estoque insuficiente para "${product.name}" (disponível: ${product.stock})`,
      409
    );
  }

  const item = await prisma.cartItem.upsert({
    where: {
      userId_productId_size_color: {
        userId: req.user.id,
        productId: data.productId,
        size: data.size ?? null,
        color: data.color ?? null,
      },
    },
    create: {
      userId: req.user.id,
      productId: data.productId,
      quantity: data.quantity,
      size: data.size,
      color: data.color,
    },
    update: {
      quantity: { increment: data.quantity },
    },
    include: { product: true },
  });

  res.status(201).json({ item });
}

// PUT /api/cart/:itemId — atualiza a quantidade de um item
export async function updateItem(req, res) {
  const { itemId } = req.params;
  const data = updateItemSchema.parse(req.body);

  const existing = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { product: true },
  });

  if (!existing || existing.userId !== req.user.id) {
    throw new AppError("Item não encontrado no carrinho", 404);
  }

  if (data.quantity > existing.product.stock) {
    throw new AppError(
      `Estoque insuficiente para "${existing.product.name}" (disponível: ${existing.product.stock})`,
      409
    );
  }

  const item = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: data.quantity },
    include: { product: true },
  });

  res.json({ item });
}

// DELETE /api/cart/:itemId — remove um item do carrinho
export async function removeItem(req, res) {
  const { itemId } = req.params;

  const existing = await prisma.cartItem.findUnique({ where: { id: itemId } });

  if (!existing || existing.userId !== req.user.id) {
    throw new AppError("Item não encontrado no carrinho", 404);
  }

  await prisma.cartItem.delete({ where: { id: itemId } });

  res.status(204).send();
}
