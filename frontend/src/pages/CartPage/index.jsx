import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { ordersApi } from "../../services/api";
import { formatPrice } from "../../utils/format";
import "./styles.css";

export default function CartPage() {
  const { items, total, updateItem, removeItem, refresh } = useCart();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState(null);

  async function handleCheckout() {
    setCheckingOut(true);
    setError(null);
    try {
      await ordersApi.create();
      await refresh();
      navigate("/meus-pedidos");
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingOut(false);
    }
  }

  // Impede digitar uma quantidade maior que o estoque disponível ou menor
  // que 1 — antes disso só era validado no backend, na hora de fechar o
  // pedido, o que deixava o usuário só descobrir o problema no checkout.
  function handleQuantityChange(item, rawValue) {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;

    const stock = item.product.stock ?? Infinity;
    const clamped = Math.min(Math.max(Math.trunc(parsed), 1), stock);

    if (clamped !== item.quantity) {
      updateItem(item.id, clamped);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container cart-page">
        <h1>Meu carrinho</h1>
        <p>Seu carrinho está vazio.</p>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <h1>Meu carrinho</h1>
      {error && <p className="cart-page__error">{error}</p>}

      <ul className="cart-page__list">
        {items.map((item) => {
          const lowStock = item.product.stock > 0 && item.product.stock <= 5;

          return (
            <li key={item.id} className="cart-page__item">
              <img src={item.product.imageUrl} alt={item.product.name} />
              <div className="cart-page__item-info">
                <span className="cart-page__item-name">{item.product.name}</span>
                {(item.size || item.color) && (
                  <span className="cart-page__item-variant">
                    {item.size && `Tam: ${item.size}`} {item.color && `Cor: ${item.color}`}
                  </span>
                )}
                <span className="cart-page__item-price">
                  {formatPrice(item.product.price)}
                </span>
                {lowStock && (
                  <span className="cart-page__item-stock-warning">
                    Últimas {item.product.stock} unidades!
                  </span>
                )}
              </div>

              <input
                type="number"
                min={1}
                max={item.product.stock || undefined}
                value={item.quantity}
                onChange={(e) => handleQuantityChange(item, e.target.value)}
              />

              <button
                type="button"
                className="cart-page__remove"
                onClick={() => removeItem(item.id)}
              >
                Remover
              </button>
            </li>
          );
        })}
      </ul>

      <div className="cart-page__footer">
        <span className="cart-page__total">Total: {formatPrice(total)}</span>
        <button type="button" onClick={handleCheckout} disabled={checkingOut}>
          {checkingOut ? "Finalizando..." : "Finalizar pedido"}
        </button>
      </div>
    </div>
  );
}
