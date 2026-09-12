import Stripe from "stripe";

// Cria o client sob demanda (não na importação do módulo) — assim, se
// STRIPE_SECRET_KEY não estiver configurada, o erro só aparece quando
// alguém de fato tenta pagar, não derruba o servidor inteiro na subida.
let stripeClient;

function getClient() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY não configurado — configure as credenciais do Stripe no .env",
      );
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

// Checkout Session = página de pagamento hospedada pelo próprio Stripe
// (cartão, e no Brasil também Pix e boleto se habilitado na conta). Evita
// lidar com dados de cartão no nosso servidor e com certificação PCI-DSS.
export async function createCheckoutSession(order) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const session = await getClient().checkout.sessions.create({
    mode: "payment",
    line_items: order.items.map((item) => ({
      price_data: {
        currency: "brl",
        product_data: { name: item.product?.name || "Produto" },
        unit_amount: Math.round(Number(item.price) * 100), // Stripe trabalha em centavos
      },
      quantity: item.quantity,
    })),
    metadata: { orderId: order.id },
    success_url: `${frontendUrl}/pedido/retorno?order=${order.id}`,
    cancel_url: `${frontendUrl}/pedido/retorno?order=${order.id}`,
  });

  return { sessionId: session.id, checkoutUrl: session.url };
}

// Verifica a assinatura do webhook — garante que a notificação realmente
// veio do Stripe, e não de alguém tentando forjar um "pagamento aprovado"
// direto na nossa API. Precisa do corpo bruto da requisição (ver app.js).
export function constructWebhookEvent(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET não configurado");
  }
  return getClient().webhooks.constructEvent(rawBody, signature, secret);
}