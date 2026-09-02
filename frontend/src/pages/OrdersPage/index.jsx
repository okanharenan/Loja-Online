import { useEffect, useState } from "react";
import { ordersApi } from "../../services/api";
import { formatPrice } from "../../utils/format";
import "./styles.css";

const STATUS_LABELS = {
  PENDING: "Pendente",
  PAID: "Pago",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    ordersApi
      .list()
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container orders-page">Carregando pedidos...</div>;
  if (error) return <div className="container orders-page">Erro: {error}</div>;

  return (
    <div className="container orders-page">
      <h1>Meus pedidos</h1>

      {orders.length === 0 && <p>Você ainda não fez nenhum pedido.</p>}

      <ul className="orders-page__list">
        {orders.map((order) => (
          <li key={order.id} className="orders-page__order">
            <div className="orders-page__order-header">
              <span>Pedido #{order.id.slice(0, 8)}</span>
              <span className={`orders-page__status orders-page__status--${order.status.toLowerCase()}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>
            <ul className="orders-page__items">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.quantity}x {item.product.name} — {formatPrice(item.price)}
                </li>
              ))}
            </ul>
            <div className="orders-page__total">
              Total: {formatPrice(order.total)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
