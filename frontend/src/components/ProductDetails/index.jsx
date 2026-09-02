import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import starIcon from "/src/assets/star-icon.svg";
import ProductOptions from "../ProductOptions";
import BuyBox from "../BuyBox";
import { GALLERY_THEMES } from "../../utils/productAdapter";
import "./styles.css";

export default function ProductDetails({ product, onAddToCart, addingToCart }) {
  const [activeImage, setActiveImage] = useState(0);
  const [direction, setDirection] = useState("next");
  const [selectedSize, setSelectedSize] = useState(product.defaultSize);
  const [selectedColor, setSelectedColor] = useState(
    product.colors.find((c) => c.selected)?.id ?? product.colors[0].id,
  );

  const touchStartX = useRef(null);
  const galleryRef = useRef(null);

  const hasMultipleImages = product.images.length > 1;
  const theme = GALLERY_THEMES[activeImage % GALLERY_THEMES.length];

  function goTo(index) {
    setDirection(index > activeImage ? "next" : "prev");
    setActiveImage(index);
  }

  function showPrev() {
    setDirection("prev");
    setActiveImage((i) => (i === 0 ? product.images.length - 1 : i - 1));
  }

  function showNext() {
    setDirection("next");
    setActiveImage((i) => (i === product.images.length - 1 ? 0 : i + 1));
  }

  // Setas do teclado navegam a galeria enquanto o mouse está sobre ela —
  // um toque a mais que a maioria dos carrosséis de loja não tem.
  useEffect(() => {
    if (!hasMultipleImages) return;

    function handleKeyDown(e) {
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    }

    const node = galleryRef.current;
    node?.addEventListener("keydown", handleKeyDown);
    return () => node?.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMultipleImages, activeImage]);

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      delta < 0 ? showNext() : showPrev();
    }
    touchStartX.current = null;
  }

  function handleBuy() {
    onAddToCart?.({ size: selectedSize, color: selectedColor });
  }

  return (
    <div className="product-details">
      <div
        className="product-details__gallery"
        ref={galleryRef}
        tabIndex={0}
      >
        {hasMultipleImages && (
          <div className="product-details__rail">
            {product.images.map((img, index) => (
              <button
                key={index}
                className={
                  "product-details__thumb" +
                  (index === activeImage ? " product-details__thumb--active" : "")
                }
                style={{ backgroundColor: GALLERY_THEMES[index % GALLERY_THEMES.length].bg }}
                onClick={() => goTo(index)}
                aria-label={`Ver imagem ${index + 1}`}
              >
                <img src={img} alt="" />
              </button>
            ))}
          </div>
        )}

        <div
          className="product-details__main-image"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {hasMultipleImages && (
            <button
              className="product-details__nav product-details__nav--prev"
              onClick={showPrev}
              aria-label="Imagem anterior"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
          )}

          <div
            className="product-details__image-frame"
            style={{
              backgroundColor: theme.bg,
              boxShadow: `0 30px 60px -20px ${theme.glow}`,
            }}
          >
            <img
              key={activeImage}
              src={product.images[activeImage]}
              alt={product.name}
              className={`product-details__image product-details__image--${direction}`}
            />

            {hasMultipleImages && (
              <span className="product-details__counter">
                {activeImage + 1} / {product.images.length}
              </span>
            )}
          </div>

          {hasMultipleImages && (
            <button
              className="product-details__nav product-details__nav--next"
              onClick={showNext}
              aria-label="Próxima imagem"
            >
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      <div className="product-details__info">
        <h1 className="product-details__name">{product.name}</h1>
        <p className="product-details__meta">
          {product.category} | {product.brand} | REF:{product.ref}
        </p>

        {product.reviews > 0 && (
          <div className="product-details__rating">
            <span
              className="product-details__stars"
              aria-label={`Avaliação ${product.rating} de 5`}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <img
                  key={i}
                  className={
                    "product-details__star" +
                    (i < product.rating ? " product-details__star--active" : "")
                  }
                  src={starIcon}
                  alt=""
                />
              ))}
            </span>

            <span className="product-details__score">
              {product.ratingScore} ★
            </span>
            <span className="product-details__reviews">
              ({product.reviews} avaliações)
            </span>
          </div>
        )}

        <BuyBox.Price price={product.price} oldPrice={product.oldPrice} />

        <div className="product-details__description">
          <h3>Descrição do produto</h3>
          <p>{product.description}</p>
        </div>

        <ProductOptions
          sizes={product.sizes}
          selectedSize={selectedSize}
          onSizeChange={setSelectedSize}
          colors={product.colors}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
        />

        <BuyBox.Cta
          onBuy={handleBuy}
          disabled={product.stock <= 0 || addingToCart}
          label={product.stock <= 0 ? "SEM ESTOQUE" : addingToCart ? "ADICIONANDO..." : "COMPRAR"}
        />
      </div>
    </div>
  );
}
