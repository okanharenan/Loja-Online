import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { createPaymentPreference, getPayment } from "../utils/mercadoPago.js";

// POST /api/orders/:id/payment — gera o link de pagamento pra um pedido já
// criado. Se o pedido já tiver uma preferência (ex: cliente saiu e voltou
// pra tentar pagar de novo), reaproveita o link em vez de criar outro.
export async function createOrderPayment(req, res) {
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

  if (order.status !== "PENDING") {
    throw new AppError("Este pedido não está mais aguardando pagamento", 409);
  }

  if (order.mpInitPoint) {
    res.json({ checkoutUrl: order.mpInitPoint });
    return;
  }

  const { preferenceId, initPoint } = await createPaymentPreference(order);

  await prisma.order.update({
    where: { id: order.id },
    data: { mpPreferenceId: preferenceId, mpInitPoint: initPoint },
  });

  res.json({ checkoutUrl: initPoint });
}


export async function handlePaymentWebhook(req, res) {
  // O Mercado Pago manda o id do pagamento tanto via query string (formato
  // legado ?topic=payment&id=123) quanto no corpo (formato novo, { data: { id } }).
  const paymentId = req.query.id || req.body?.data?.id;
  const topic = req.query.topic || req.body?.type;

 
  if (topic && topic !== "payment") {
    res.sendStatus(200);
    return;
  }

  if (!paymentId) {
    res.sendStatus(200);
    return;
  }

  const payment = await getPayment(paymentId);
  const orderId = payment.external_reference;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    // Pedido pode ter sido de outro ambiente (teste) ou já foi removido —
    // não é um erro do nosso lado, só confirma o recebimento.
    res.sendStatus(200);
    return;
  }

  // Idempotência: se o pedido já está num estado final, não faz nada de
  // novo — o Mercado Pago pode reenviar a mesma notificação várias vezes.
  if (order.status === "PAID" || order.status === "CANCELLED") {
    res.sendStatus(200);
    return;
  }

  if (payment.status === "approved") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", mpPaymentId: String(payment.id) },
    });
  } else if (["rejected", "cancelled", "refunded", "charged_back"].includes(payment.status)) {
    // Pagamento não foi adiante — devolve o estoque que tinha sido
    // reservado na criação do pedido, numa transação só.
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", mpPaymentId: String(payment.id) },
      }),
      ...order.items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        }),
      ),
    ]);
  }
 

  res.sendStatus(200);
}