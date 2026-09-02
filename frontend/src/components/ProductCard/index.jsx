import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/format";
import "./styles.css";

export default function ProductCard({ product }) {
  const { id, name, category, image, price, oldPrice, discount } = product;

  return (
    <Link to={`/produto/${id}`} className="product-card">
      <div className="product-card__image-wrap">
        {discount && <span className="product-card__badge">{discount}</span>}
        <img src={image} alt={name} loading="lazy" />
      </div>
      <div className="product-card__info">
        <span className="product-card__category">{category}</span>
        <h3 className="product-card__name">{name}</h3>
        <div className="product-card__prices">
          {oldPrice && (
            <span className="product-card__old-price">
              {formatPrice(oldPrice)}
            </span>
          )}
          <span className="product-card__price">{formatPrice(price)}</span>
        </div>
      </div>
    </Link>
  );
}