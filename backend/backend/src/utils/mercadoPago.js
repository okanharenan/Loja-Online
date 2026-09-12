const MP_API_URL = "https://api.mercadopago.com";

function getAccessToken() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "MP_ACCESS_TOKEN não configurado — configure as credenciais do Mercado Pago no .env",
    );
  }
  return token;
}

// Cria uma preferência de pagamento pra um pedido já existente e devolve a
// URL de checkout (init_point) pra onde o cliente deve ser redirecionado.
export async function createPaymentPreference(order) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3333";

  const items = order.items.map((item) => ({
    title: item.product?.name || "Produto",
    quantity: item.quantity,
    unit_price: Number(item.price),
    currency_id: "BRL",
  }));

  const response = await fetch(`${MP_API_URL}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items,
      external_reference: order.id,
      notification_url: `${backendUrl}/api/payments/webhook`,
      back_urls: {
        success: `${frontendUrl}/pedido/retorno?order=${order.id}`,
        pending: `${frontendUrl}/pedido/retorno?order=${order.id}`,
        failure: `${frontendUrl}/pedido/retorno?order=${order.id}`,
      },
      auto_return: "approved",
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Erro ao criar preferência no Mercado Pago:", data);
    throw new Error("Não foi possível iniciar o pagamento. Tente novamente.");
  }

  return { preferenceId: data.id, initPoint: data.init_point };
}

// Busca os detalhes de um pagamento específico — usado pelo webhook pra
// confirmar o status real antes de marcar o pedido como pago (nunca
// confiamos cegamente no conteúdo da notificação em si).
export async function getPayment(paymentId) {
  const response = await fetch(`${MP_API_URL}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar pagamento ${paymentId} no Mercado Pago`);
  }

  return response.json();
}