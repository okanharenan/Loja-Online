import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { formatPrice } from "../../utils/format";
import { useWishlist } from "../../context/WishlistContext";
import "./styles.css";

export default function ProductCard({ product }) {
  const { id, productId, name, category, image, price, oldPrice, discount } = product;
  const { isWishlisted, toggle } = useWishlist();
  const navigate = useNavigate();

  const favorited = productId ? isWishlisted(productId) : false;

  async function handleToggleWishlist(e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggle(productId);
    } catch (err) {
      if (err.code === "NOT_AUTHENTICATED") {
        navigate("/entrar");
      }
    }
  }

  return (
    <Link to={`/produto/${id}`} className="product-card">
      <div className="product-card__image-wrap">
        {discount && <span className="product-card__badge">{discount}</span>}
        <button
          type="button"
          className={
            "product-card__wishlist" + (favorited ? " product-card__wishlist--active" : "")
          }
          onClick={handleToggleWishlist}
          aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={favorited}
        >
          <Heart size={18} fill={favorited ? "currentColor" : "none"} />
        </button>
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