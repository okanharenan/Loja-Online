import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { ordersApi } from "../../services/api";
import "./styles.css";

// O Mercado Pago sempre nos traz de volta pra essa tela depois do
// pagamento (aprovado, pendente ou recusado). Em vez de confiar no que
// vem na URL (o cliente pode editar isso), buscamos o pedido de novo no
// nosso banco pra mostrar o status real, que só muda de verdade quando o
// webhook confirma o pagamento no backend.
export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    // O webhook do Stripe pode demorar alguns segundos pra chegar —
    // tenta de novo umas poucas vezes antes de desistir e mostrar "pendente".
    let attempts = 0;
    let cancelled = false;

    function poll() {
      ordersApi
        .get(orderId)
        .then((data) => {
          if (cancelled) return;
          setOrder(data.order);
          attempts += 1;
          if (data.order.status === "PENDING" && attempts < 5) {
            setTimeout(poll, 2000);
          } else {
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err.message);
            setLoading(false);
          }
        });
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="container payment-return">
        <h1>Pedido não encontrado</h1>
        <p>Não recebemos o número do pedido nesse retorno.</p>
        <Link to="/produtos" className="payment-return__cta">
          Voltar às compras
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container payment-return">
        <h1>Confirmando seu pagamento...</h1>
        <p>Isso leva só alguns segundos.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container payment-return">
        <h1>Não foi possível confirmar</h1>
        <p className="payment-return__error">{error}</p>
      </div>
    );
  }

  const status = order?.status;

  const STATUS_CONFIG = {
    PAID: {
      icon: CheckCircle2,
      color: "success",
      title: "Pagamento aprovado!",
      text: "Seu pedido já está sendo preparado.",
    },
    PENDING: {
      icon: Clock,
      color: "pending",
      title: "Pagamento pendente",
      text: "Assim que confirmarmos (pode levar alguns minutos, especialmente no boleto), você recebe a confirmação por e-mail.",
    },
    CANCELLED: {
      icon: XCircle,
      color: "error",
      title: "Pagamento não aprovado",
      text: "Não foi dessa vez — o estoque reservado já foi liberado. Você pode tentar de novo quando quiser.",
    },
  };

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;

  return (
    <div className="container payment-return">
      <div className={`payment-return__icon payment-return__icon--${config.color}`}>
        <Icon size={40} strokeWidth={2} />
      </div>
      <h1>{config.title}</h1>
      <p>{config.text}</p>

      <div className="payment-return__actions">
        <Link to="/meus-pedidos" className="payment-return__cta">
          Ver meus pedidos
        </Link>
        {status === "CANCELLED" && (
          <Link to="/produtos" className="payment-return__cta payment-return__cta--secondary">
            Continuar comprando
          </Link>
        )}
      </div>
    </div>
  );
}