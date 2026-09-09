import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shirt,
  PersonStanding,
  CircleDot,
  Headphones,
  Footprints,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Section from "../../components/Section";
import ProductListing from "../../components/ProductListing";
import { productsApi } from "../../services/api";
import { adaptProductSummary } from "../../utils/productAdapter";
import { formatPrice } from "../../utils/format";
import "./styles.css";

const HERO_SLIDES = [
  {
    image: "/home-slide-5.jpeg",
    eyebrow: "Melhores ofertas personalizadas",
    title: "Queima de estoque Nike 🔥",
    text: "Consequat culpa exercitation mollit nisi excepteur do do tempor laboris eiusmod irure consectetur.",
    ctaLabel: "Ver Ofertas",
    ctaHref: "/produtos?brand=Nike",
  },
  {
    image: "/home-slide-6.jpeg",
    eyebrow: "Chegou a nova coleção",
    title: "Conforto que veste estilo",
    text: "Peças em parceria com grandes marcas de streetwear, direto pra sua coleção.",
    ctaLabel: "Conferir coleção",
    ctaHref: "/produtos",
  },
  {
    image: "/home-slide-8.jpeg",
    eyebrow: "Edição limitada",
    title: "Performance com atitude",
    text: "Tecnologia Flyknit e amortecimento leve pra quem não abre mão do estilo.",
    ctaLabel: "Ver lançamentos",
    ctaHref: "/produtos",
  },
];

const COLLECTIONS = [
  {
    image: "/collection-1.png",
    href: "/produtos?category=Camisetas",
    badge: "30% OFF",
  },
  {
    image: "/collection-2.png",
    href: "/produtos?brand=Adidas",
    badge: "30% OFF",
  },
  {
    image: "/collection-3.png",
    href: "/produtos?category=Headphones",
    badge: "30% OFF",
  },
];

const CATEGORY_ICONS = [
  { label: "Camisetas", icon: Shirt, href: "/produtos?category=Camisetas" },
  { label: "Calças", icon: PersonStanding, href: "/produtos?category=Calças" },
  { label: "Bonés", icon: CircleDot, href: "/produtos?category=Bonés" },
  { label: "Headphones", icon: Headphones, href: "/produtos?category=Headphones" },
  { label: "Tênis", icon: Footprints, href: "/produtos?category=Tênis" },
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [featuredProduct, setFeaturedProduct] = useState(null);

  const SLIDE_DURATION = 5000;

  useEffect(() => {
    productsApi
      .list()
      .then((data) => setProducts(data.products.map(adaptProductSummary)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Produto do banner final é buscado por slug fixo, não pelo primeiro item
  // da lista geral — a ordem da lista muda conforme produtos são
  // criados/editados, o que fazia o banner às vezes linkar pra um tênis
  // completamente diferente do que a promoção anunciava.
  useEffect(() => {
    productsApi
      .get("nike-revolution-6")
      .then((data) => setFeaturedProduct(adaptProductSummary(data.product)))
      .catch(() => {
        // se esse produto específico não existir no banco, o banner some
        // o preço e só linka pra listagem geral — nunca mostra dado errado
      });
  }, []);

  // Troca de slide automática — pausa quando o mouse está em cima (padrão
  // de carrossel profissional) e reinicia a contagem sempre que o slide
  // muda, seja pelo timer, pelas setas ou por clique nos pontinhos.
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((i) => (i + 1) % HERO_SLIDES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [activeSlide, isPaused]);

  function showPrevSlide() {
    setActiveSlide((i) => (i === 0 ? HERO_SLIDES.length - 1 : i - 1));
  }

  function showNextSlide() {
    setActiveSlide((i) => (i + 1) % HERO_SLIDES.length);
  }

  return (
    <div className="home-page">
      {/* Hero — carrossel full-bleed com zoom cinematográfico, setas e
          barra de progresso nos pontinhos */}
      <section
        className="home-hero"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.image}
            className={
              "home-hero__slide" +
              (index === activeSlide ? " home-hero__slide--active" : "")
            }
          >
            <div
              className="home-hero__bg"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            <div className="home-hero__overlay" />

            <div className="container home-hero__inner">
              <div className="home-hero__content">
                <span className="home-hero__eyebrow">{slide.eyebrow}</span>
                <h1 className="home-hero__title">{slide.title}</h1>
                <p className="home-hero__text">{slide.text}</p>
                <Link to={slide.ctaHref} className="home-hero__cta">
                  {slide.ctaLabel}
                </Link>
              </div>
            </div>
          </div>
        ))}

        <div className="container home-hero__controls">
          <button
            type="button"
            className="home-hero__nav home-hero__nav--prev"
            onClick={showPrevSlide}
            aria-label="Slide anterior"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>

          <div className="home-hero__slider-dots">
            {HERO_SLIDES.map((slide, i) => (
              <button
                key={slide.image}
                type="button"
                aria-label={`Ir para slide ${i + 1}`}
                className={
                  "home-hero__dot" + (i === activeSlide ? " home-hero__dot--active" : "")
                }
                onClick={() => setActiveSlide(i)}
              >
                {i === activeSlide && (
                  <span
                    key={activeSlide}
                    className="home-hero__dot-fill"
                    style={{
                      animationDuration: `${SLIDE_DURATION}ms`,
                      animationPlayState: isPaused ? "paused" : "running",
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="home-hero__nav home-hero__nav--next"
            onClick={showNextSlide}
            aria-label="Próximo slide"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {/* Coleções em destaque — cards promocionais */}
      <section className="container home-collections">
        <h2 className="home-collections__title">Coleções em destaque</h2>

        <div className="home-collections__grid">
          {COLLECTIONS.map((item) => (
            <Link key={item.image} to={item.href} className="home-collection-card">
              <span className="home-collection-card__badge">{item.badge}</span>
              <img src={item.image} alt="" />
              <span className="home-collection-card__cta">Comprar</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Categorias com ícone */}
      <section className="container home-categories">
        <h2 className="home-categories__title">Compre por categoria</h2>

        <div className="home-categories__grid">
          {CATEGORY_ICONS.map(({ label, icon: Icon, href }) => (
            <Link key={label} to={href} className="home-category-icon">
              <span className="home-category-icon__circle">
                <Icon size={22} strokeWidth={1.6} />
              </span>
              <span className="home-category-icon__label">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Produtos em alta */}
      <Section title="Produtos em alta" viewAllHref="/produtos">
        {loading && <p>Carregando produtos...</p>}
        {error && <p className="home-page__error">Erro: {error}</p>}
        {!loading && !error && (
          <ProductListing products={products.slice(0, 8)} columns={4} />
        )}
      </Section>

      {/* Banner final — oferta especial */}
      <section className="container home-feature-banner">
        <div className="home-feature-banner__image-wrap">
          <span className="home-feature-banner__dots" aria-hidden="true" />
          <img
            src={featuredProduct?.image || "/product-thumb-1.jpeg"}
            alt={featuredProduct?.name || "Tênis em destaque"}
          />
        </div>

        <div className="home-feature-banner__content">
          <span className="home-feature-banner__badge">
            <Sparkles size={14} strokeWidth={2.5} />
            Oferta especial
          </span>
          <h2 className="home-feature-banner__title">
            {featuredProduct?.name || "Destaque da semana"}
          </h2>
          <p className="home-feature-banner__text">
            Tecnologia Next Nature e conforto pro dia a dia — um dos
            queridinhos da nossa vitrine, com desconto por tempo limitado.
          </p>

          {featuredProduct && (
            <div className="home-feature-banner__price">
              {featuredProduct.oldPrice && (
                <span className="home-feature-banner__price-old">
                  {formatPrice(featuredProduct.oldPrice)}
                </span>
              )}
              <span className="home-feature-banner__price-current">
                {formatPrice(featuredProduct.price)}
              </span>
            </div>
          )}

          <Link
            to={featuredProduct ? `/produto/${featuredProduct.id}` : "/produtos"}
            className="home-feature-banner__cta"
          >
            Ver Oferta
          </Link>
        </div>
      </section>
    </div>
  );
}