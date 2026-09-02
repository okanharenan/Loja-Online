import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

// POST /api/orders — cria um pedido a partir do carrinho atual do usuário
export async function createOrder(req, res) {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    throw new AppError("Carrinho está vazio", 400);
  }

  // Confere estoque antes de fechar o pedido
  for (const item of cartItems) {
    if (item.product.stock < item.quantity) {
      throw new AppError(
        `Estoque insuficiente para "${item.product.name}"`,
        409
      );
    }
  }

  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  // Transação: cria o pedido, os itens, abate o estoque e limpa o carrinho
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId: req.user.id,
        total,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
            size: item.size,
            color: item.color,
          })),
        },
      },
      include: { items: true },
    });

    for (const item of cartItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.cartItem.deleteMany({ where: { userId: req.user.id } });

    return newOrder;
  });

  res.status(201).json({ order });
}

// GET /api/orders — lista os pedidos do usuário logado
export async function listOrders(req, res) {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  res.json({ orders });
}

// GET /api/orders/:id — detalhe de um pedido (só o dono ou admin)
export async function getOrder(req, res) {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    throw new AppError("Pedido não encontrado", 404);
  }

  if (order.userId !== req.user.id && req.user.role !== "ADMIN") {
    throw new AppError("Acesso negado a este pedido", 403);
  }

  res.json({ order });
}
