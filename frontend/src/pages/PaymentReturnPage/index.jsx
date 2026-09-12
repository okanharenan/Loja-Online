import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { createCheckoutSession, constructWebhookEvent } from "../utils/stripe.js";

// POST /api/orders/:id/payment — gera o link de pagamento pra um pedido já
// criado. Se o pedido já tiver uma sessão de checkout (ex: cliente saiu e
// voltou pra tentar pagar de novo), reaproveita o link em vez de criar outro.
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

  if (order.stripeCheckoutUrl) {
    res.json({ checkoutUrl: order.stripeCheckoutUrl });
    return;
  }

  const { sessionId, checkoutUrl } = await createCheckoutSession(order);

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: sessionId, stripeCheckoutUrl: checkoutUrl },
  });

  res.json({ checkoutUrl });
}

async function markOrderPaid(orderId, paymentIntentId) {
  if (!orderId) return;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  // Idempotência: o Stripe pode reenviar o mesmo evento mais de uma vez.
  if (!order || order.status === "PAID" || order.status === "CANCELLED") return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PAID",
      stripePaymentIntentId: paymentIntentId ? String(paymentIntentId) : null,
    },
  });
}

async function cancelOrderAndRestoreStock(orderId) {
  if (!orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.status === "PAID" || order.status === "CANCELLED") return;

  // Pagamento não foi adiante — devolve o estoque reservado na criação do
  // pedido, numa transação só.
  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } }),
    ...order.items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      }),
    ),
  ]);
}

// POST /api/payments/webhook — chamado pelo Stripe, não pelo nosso front.
// A rota recebe o corpo BRUTO da requisição (configurado em app.js) porque
// a verificação de assinatura abaixo precisa dos bytes originais — se o
// corpo já tivesse passado por JSON.parse, a assinatura não bateria mais.
export async function handlePaymentWebhook(req, res) {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error("Assinatura de webhook do Stripe inválida:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  const session = event.data.object;
  const orderId = session.metadata?.orderId;

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await markOrderPaid(orderId, session.payment_intent);
      break;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await cancelOrderAndRestoreStock(orderId);
      break;
    default:
      break; // outros eventos do Stripe não nos interessam
  }

  res.json({ received: true });
}