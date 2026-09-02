// Formata um valor numérico (ou string vinda do Prisma Decimal) como moeda
// brasileira. Centralizado aqui pra não repetir `.toFixed(2).replace(...)`
// em ProductCard, BuyBox, CartPage e OrdersPage com pequenas variações.
export function formatPrice(value) {
  return `R$ ${Number(value ?? 0).toFixed(2).replace(".", ",")}`;
}
