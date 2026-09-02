// Popula o banco com produtos de exemplo (baseados no mock atual do front)
// e um usuário admin para testes.
// Rode com: npm run seed

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Imagens reais que já existem em frontend/public/. Usamos caminho relativo
// porque o Vite serve o conteúdo de public/ direto na raiz do site — o
// navegador resolve "/product-thumb-1.jpeg" contra a própria origem do front,
// sem precisar de nenhum serviço externo (nem placeholder).
const PRODUCT_IMAGES = [
  "/product-thumb-1.jpeg",
  "/product-thumb-3.jpeg",
  "/product-thumb-4.jpeg",
  "/product-thumb-5.jpeg",
  "/produc-image-1.jpeg",
  "/produc-image-2.jpeg",
  "/produc-image-3.jpeg",
  "/produc-image-5.jpeg",
];

function withDiscount(price) {
  return Number((price / 0.7).toFixed(2)); // oldPrice pro desconto dar 30%
}

const BULK_PRODUCTS = [
  { name: "K-Swiss V8 - Masculino", brand: "K-Swiss", category: "Tênis", gender: "MASCULINO", price: 140, sizes: ["38", "39", "40", "41", "42"], colors: ["black", "white"] },
  { name: "K-Swiss V8 - Feminino", brand: "K-Swiss", category: "Tênis", gender: "FEMININO", price: 140, sizes: ["35", "36", "37", "38", "39"], colors: ["white", "pink"] },
  { name: "Adidas Runfalcon 3.0", brand: "Adidas", category: "Corrida", gender: "MASCULINO", price: 210, sizes: ["39", "40", "41", "42", "43"], colors: ["black", "blue"] },
  { name: "Adidas Ultraboost Light", brand: "Adidas", category: "Corrida", gender: "UNISSEX", price: 350, sizes: ["38", "39", "40", "41"], colors: ["white", "gray"] },
  { name: "Nike Air Max SC", brand: "Nike", category: "Casual", gender: "MASCULINO", price: 260, sizes: ["39", "40", "41", "42", "43"], colors: ["white", "red"] },
  { name: "Nike Revolution 6 Feminino", brand: "Nike", category: "Casual", gender: "FEMININO", price: 190, sizes: ["35", "36", "37", "38"], colors: ["black", "purple"] },
  { name: "Puma Cell Vive", brand: "Puma", category: "Esporte e lazer", gender: "MASCULINO", price: 230, sizes: ["40", "41", "42", "43", "44"], colors: ["gray", "orange"] },
  { name: "Puma Smash 3.0", brand: "Puma", category: "Casual", gender: "UNISSEX", price: 170, sizes: ["37", "38", "39", "40", "41"], colors: ["white", "black"] },
  { name: "Balenciaga Track", brand: "Balenciaga", category: "Utilitário", gender: "UNISSEX", price: 890, sizes: ["39", "40", "41", "42"], colors: ["black", "gray"] },
  { name: "K-Swiss Classic 66", brand: "K-Swiss", category: "Casual", gender: "MASCULINO", price: 160, sizes: ["39", "40", "41", "42"], colors: ["white", "green"] },
  { name: "Adidas Gazelle", brand: "Adidas", category: "Casual", gender: "FEMININO", price: 220, sizes: ["35", "36", "37", "38"], colors: ["blue", "black"] },
  { name: "Nike Downshifter 12", brand: "Nike", category: "Corrida", gender: "MASCULINO", price: 175, sizes: ["40", "41", "42", "43", "44"], colors: ["black", "yellow"] },
  { name: "Puma Caven 2.0", brand: "Puma", category: "Esporte e lazer", gender: "FEMININO", price: 150, sizes: ["35", "36", "37", "38"], colors: ["pink", "white"] },
  { name: "Adidas Forum Low", brand: "Adidas", category: "Casual", gender: "UNISSEX", price: 280, sizes: ["38", "39", "40", "41", "42"], colors: ["white", "blue"] },
  { name: "K-Swiss Aero Trainer", brand: "K-Swiss", category: "Esporte e lazer", gender: "MASCULINO", price: 195, sizes: ["40", "41", "42", "43"], colors: ["gray", "red"] },
];

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@digitalstore.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@digitalstore.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Produto em destaque, usado na página de produto e no banner da Home
  await prisma.product.upsert({
    where: { slug: "nike-revolution-6" },
    update: {},
    create: {
      name: "Tênis Nike Revolution 6 Next Nature Masculino",
      slug: "nike-revolution-6",
      description:
        "Tênis casual confortável para o dia a dia, com solado leve e cabedal respirável.",
      price: 219.0,
      oldPrice: 259.0,
      imageUrl: "/product-thumb-1.jpeg",
      category: "Casual",
      brand: "Nike",
      gender: "MASCULINO",
      rating: 4.7,
      reviewsCount: 90,
      sizes: ["39", "40", "41", "42", "43"],
      colors: ["blue", "red", "black", "purple"],
      stock: 50,
    },
  });

  // Grid de produtos variados — marca/categoria/gênero diferentes, pra dar
  // pra testar os filtros da listagem de verdade.
  for (const [index, item] of BULK_PRODUCTS.entries()) {
    const slug = `${item.brand.toLowerCase().replace(/\s+/g, "-")}-${index + 1}`;
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: item.name,
        slug,
        description: `${item.name}, ideal para uso ${item.category.toLowerCase()}.`,
        price: item.price,
        oldPrice: withDiscount(item.price),
        imageUrl: PRODUCT_IMAGES[index % PRODUCT_IMAGES.length],
        category: item.category,
        brand: item.brand,
        gender: item.gender,
        sizes: item.sizes,
        colors: item.colors,
        stock: 3 + (index % 5) * 7, // varia estoque (inclui casos de "últimas unidades")
      },
    });
  }

  console.log("Seed concluído com sucesso.");
  console.log("Login admin -> email: admin@digitalstore.com | senha: admin123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
