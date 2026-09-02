import "./styles.css";

function Price({ price, oldPrice }) {
  const [intPart, decPart] = price.toFixed(2).split(".");

  return (
    <div className="buy-box__price-row">
      <span className="buy-box__currency">R$</span>
      <span className="buy-box__price">
        {intPart}
        <span className="buy-box__cents">,{decPart}</span>
      </span>
      {oldPrice && oldPrice !== price && (
        <span className="buy-box__old-price">{oldPrice.toFixed(2).replace(".", ",")}</span>
      )}
    </div>
  );
}

function Cta({ onBuy, disabled, label = "COMPRAR" }) {
  return (
    <button type="button" className="buy-box__cta" onClick={onBuy} disabled={disabled}>
      {label}
    </button>
  );
}

export default function BuyBox({ price, oldPrice, onBuy, disabled }) {
  return (
    <div className="buy-box">
      <Price price={price} oldPrice={oldPrice} />
      <Cta onBuy={onBuy} disabled={disabled} />
    </div>
  );
}

BuyBox.Price = Price;
BuyBox.Cta = Cta;