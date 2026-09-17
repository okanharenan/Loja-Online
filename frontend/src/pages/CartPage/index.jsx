import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { ordersApi, addressApi } from "../../services/api";
import { formatPrice } from "../../utils/format";
import "./styles.css";

export default function CartPage() {
  const { items, total, updateItem, removeItem, refresh } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState(null);

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  useEffect(() => {
    addressApi
      .list()
      .then((data) => {
        setAddresses(data.addresses);
        const defaultAddress = data.addresses.find((a) => a.isDefault) || data.addresses[0];
        if (defaultAddress) setSelectedAddressId(defaultAddress.id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingAddresses(false));
  }, []);

  async function handleCheckout() {
    if (!selectedAddressId) {
      setError("Escolha um endereço de entrega antes de continuar.");
      return;
    }

    setCheckingOut(true);
    setError(null);
    try {
      const { order } = await ordersApi.create(selectedAddressId);
      const { checkoutUrl } = await ordersApi.pay(order.id);
      await refresh();
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err.message);
      setCheckingOut(false);
    }
  }

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

      <div className="cart-page__address">
        <div className="cart-page__address-header">
          <h2>Endereço de entrega</h2>
          <Link to="/enderecos">Gerenciar endereços</Link>
        </div>

        {loadingAddresses && <p>Carregando endereços...</p>}

        {!loadingAddresses && addresses.length === 0 && (
          <p className="cart-page__address-empty">
            Você ainda não tem um endereço cadastrado.{" "}
            <Link to="/enderecos">Cadastrar agora</Link>
          </p>
        )}

        {!loadingAddresses && addresses.length > 0 && (
          <div className="cart-page__address-list">
            {addresses.map((address) => (
              <label key={address.id} className="cart-page__address-option">
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddressId === address.id}
                  onChange={() => setSelectedAddressId(address.id)}
                />
                <span>
                  <strong>{address.label || "Endereço"}</strong> — {address.street},{" "}
                  {address.number}, {address.city}/{address.state}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="cart-page__footer">
        <span className="cart-page__total">Total: {formatPrice(total)}</span>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={checkingOut || !selectedAddressId}
        >
          {checkingOut ? "Finalizando..." : "Finalizar pedido"}
        </button>
      </div>
    </div>
  );
}