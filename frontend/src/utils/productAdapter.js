// O backend guarda cores como strings simples (ex: "blue", "black") e uma
// única imagem por produto. Os componentes de UI foram feitos pensando num
// mock mais rico (várias imagens, cores com hex). Este arquivo faz a ponte
// entre os dois formatos, sem precisar mudar o schema do banco.

const COLOR_HEX = {
  black: "#0a0a0a",
  white: "#f5f5f5",
  blue: "#2563eb",
  red: "#dc2626",
  green: "#16a34a",
  yellow: "#eab308",
  purple: "#9333ea",
  pink: "#ec4899",
  gray: "#6b7280",
  cinza: "#6b7280",
  orange: "#f97316",
};

const PLACEHOLDER_IMAGE = "/collection-1.png";

// Cada slide do carrossel de imagens do produto usa uma cor de fundo + um
// brilho (glow) combinando atrás da foto — é um recurso puramente visual (a
// foto em si é a mesma, duplicada, porque o banco só guarda 1 imagem por
// produto), pra imitar o efeito de "vitrine" que lojas como Nike/Adidas usam.
export const GALLERY_THEMES = [
  { bg: "#E3E2F9", glow: "rgba(124, 58, 237, 0.28)" },
  { bg: "#FDE4CF", glow: "rgba(249, 115, 22, 0.26)" },
  { bg: "#D9F2E6", glow: "rgba(16, 185, 129, 0.26)" },
  { bg: "#DCEBFC", glow: "rgba(37, 99, 235, 0.26)" },
];

// Preço vem do Prisma como Decimal e chega no JSON como string (ex: "219.00").
// Sempre convertemos pra number antes de qualquer conta ou .toFixed().
export function toPrice(value) {
  return Number(value ?? 0);
}

// Formato usado pelo ProductCard / ProductListing
export function adaptProductSummary(product) {
  const price = toPrice(product.price);
  const oldPrice = product.oldPrice ? toPrice(product.oldPrice) : undefined;
  const discountPct = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  return {
    id: product.slug || product.id,
    name: product.name,
    category: product.category || "",
    image: product.imageUrl || PLACEHOLDER_IMAGE,
    price,
    oldPrice,
    discount: discountPct > 0 ? `${discountPct}% OFF` : undefined,
  };
}

// Formato usado pelo ProductDetails / BuyBox / ProductOptions
export function adaptProductDetails(product) {
  const colors = (product.colors || []).map((name) => ({
    id: name,
    hex: COLOR_HEX[name.toLowerCase()] || "#cccccc",
  }));

  const mainImage = product.imageUrl || PLACEHOLDER_IMAGE;
  // O banco guarda 1 imagem só por produto. Duplicamos ela pra ter o que
  // mostrar no carrossel/miniaturas — assim que existir mais de uma imagem
  // de verdade no schema, é só trocar essa linha por `product.images`.
  const images = Array.from({ length: 4 }, () => mainImage);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category || "",
    brand: product.brand || product.category || "Digital Store",
    ref: product.id?.slice(0, 8) || "",
    description: product.description || "Sem descrição disponível para este produto.",
    price: toPrice(product.price),
    oldPrice: product.oldPrice ? toPrice(product.oldPrice) : undefined,
    images,
    sizes: product.sizes || [],
    defaultSize: (product.sizes || [])[0],
    colors: colors.length > 0 ? colors : [{ id: "unico", hex: "#cccccc" }],
    rating: product.rating ? Math.round(product.rating) : 0,
    ratingScore: product.rating ?? null,
    reviews: product.reviewsCount ?? 0,
    stock: product.stock ?? 0,
  };
}