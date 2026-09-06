import { useMemo } from "react";
import { useWishlist } from "../../context/WishlistContext";
import { adaptProductSummary } from "../../utils/productAdapter";
import ProductListing from "../../components/ProductListing";
import "./styles.css";

export default function WishlistPage() {
  const { items, loading } = useWishlist();


  const products = useMemo(
    () => items.filter((item) => item.product).map((item) => adaptProductSummary(item.product)),
    [items]
  );

  return (
    <div className="container wishlist-page">
      <h1>Meus favoritos</h1>

      {loading && <p>Carregando...</p>}

      {!loading && products.length === 0 && (
        <p className="wishlist-page__empty">
          Você ainda não favoritou nenhum produto. Clique no coração de um
          produto pra guardá-lo aqui.
        </p>
      )}

      {!loading && products.length > 0 && <ProductListing products={products} columns={4} />}
    </div>
  );
}