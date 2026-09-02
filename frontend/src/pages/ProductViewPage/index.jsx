import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductDetails from "../../components/ProductDetails";
import Breadcrumb from "../../components/Breadcrumb";
import Section from "../../components/Section";
import ProductListing from "../../components/ProductListing";
import { productsApi } from "../../services/api";
import { adaptProductDetails, adaptProductSummary } from "../../utils/productAdapter";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import "./styles.css";

export default function ProductViewPage() {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [related, setRelated] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProduct(null);
    setRelated([]);

    productsApi
      .get(idOrSlug)
      .then((data) => {
        if (cancelled) return;
        const adapted = adaptProductDetails(data.product);
        setProduct(adapted);

        // Produtos relacionados: mesma categoria, excluindo o produto atual
        if (data.product.category) {
          productsApi
            .list({ category: data.product.category })
            .then((relatedData) => {
              if (cancelled) return;
              const others = relatedData.products
                .filter((p) => p.id !== data.product.id)
                .slice(0, 4)
                .map(adaptProductSummary);
              setRelated(others);
            })
            .catch(() => {
              /* falha ao buscar relacionados não deve quebrar a página */
            });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idOrSlug]);

  async function handleAddToCart({ size, color }) {
    if (!user) {
      navigate("/entrar", { state: { from: `/produto/${idOrSlug}` } });
      return;
    }
    setAddingToCart(true);
    setFeedback(null);
    try {
      await addItem(product.id, 1, size, color);
      setFeedback({ type: "success", message: "Produto adicionado ao carrinho!" });
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return <div className="container product-view-page">Carregando produto...</div>;
  }

  if (error || !product) {
    return (
      <div className="container product-view-page">
        <p className="product-view-page__error">
          {error || "Produto não encontrado."}
        </p>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Produtos", href: "/produtos" },
    ...(product.category
      ? [{ label: product.category, href: `/produtos?category=${product.category}` }]
      : []),
    ...(product.brand ? [{ label: product.brand, href: `/produtos?brand=${product.brand}` }] : []),
    { label: product.name },
  ];

  return (
    <div className="product-view-page">
      <div className="container">
        <Breadcrumb items={breadcrumbItems} />

        {feedback && (
          <div className={`product-view-page__feedback product-view-page__feedback--${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        <ProductDetails
          product={product}
          onAddToCart={handleAddToCart}
          addingToCart={addingToCart}
        />
      </div>

      {related.length > 0 && (
        <Section
          title="Produtos Relacionados"
          viewAllHref={`/produtos?category=${product.category}`}
          className="product-view-page__related"
        >
          <ProductListing products={related} columns={4} />
        </Section>
      )}
    </div>
  );
}
