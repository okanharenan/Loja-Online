import ProductCard from "../ProductCard";
import "./styles.css";

// Grid reutilizável de ProductCards. Usado pela Home, pela página de produto
// (relacionados) e pela página de listagem.
// `columns` controla quantas colunas o grid tem em telas largas (o CSS reduz
// automaticamente em telas menores).
export default function ProductListing({ products, columns = 4 }) {
  if (!products || products.length === 0) return null;

  return (
    <div
      className="product-listing"
      style={{ "--product-listing-columns": columns }}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
