import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  description: z.string().optional(),
  price: z.number().positive("Preço deve ser maior que zero"),
  oldPrice: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  gender: z.enum(["MASCULINO", "FEMININO", "UNISSEX"]).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewsCount: z.number().int().min(0).optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  stock: z.number().int().min(0).optional(),
});

// Aceita um único valor ou uma lista separada por vírgula (ex: "Nike,Adidas")
// e monta o filtro certo pro Prisma (igualdade simples ou "in").
function multiFilter(value) {
  if (!value) return undefined;
  const values = String(value).split(",").filter(Boolean);
  return values.length > 1 ? { in: values } : values[0];
}

const MAX_PAGE_SIZE = 60;
const DEFAULT_PAGE_SIZE = 12;

// GET /api/products — lista pública, com filtros opcionais via query string
// Ex: /api/products?category=tenis&q=nike&minPrice=100&maxPrice=500&brand=Nike,Adidas&gender=MASCULINO&page=1&limit=12
//
// Paginado: sem isso, um catálogo grande faz o findMany trazer a tabela
// inteira de uma vez a cada busca/filtro. `limit` é limitado a
// MAX_PAGE_SIZE pra ninguém pedir a página inteira de propósito.
export async function listProducts(req, res) {
  const { category, q, minPrice, maxPrice, size, color, brand, gender, page, limit } =
    req.query;

  const where = {
    active: true,
    ...(category && { category: multiFilter(category) }),
    ...(brand && { brand: multiFilter(brand) }),
    ...(gender && { gender: multiFilter(gender) }),
    ...(q && {
      name: { contains: String(q), mode: "insensitive" },
    }),
    ...(size && { sizes: { has: String(size) } }),
    ...(color && { colors: { has: String(color) } }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: Number(minPrice) }),
        ...(maxPrice && { lte: Number(maxPrice) }),
      },
    }),
  };

  const currentPage = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Number(limit) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products,
    meta: {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  });
}

// GET /api/products/:idOrSlug — aceita tanto UUID quanto slug
export async function getProduct(req, res) {
  const { idOrSlug } = req.params;

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      active: true,
    },
  });

  if (!product) {
    throw new AppError("Produto não encontrado", 404);
  }

  res.json({ product });
}

// POST /api/products — somente admin
export async function createProduct(req, res) {
  const data = productSchema.parse(req.body);

  const product = await prisma.product.create({ data });

  res.status(201).json({ product });
}

// PUT /api/products/:id — somente admin
export async function updateProduct(req, res) {
  const { id } = req.params;
  const data = productSchema.partial().parse(req.body);

  const product = await prisma.product.update({
    where: { id },
    data,
  });

  res.json({ product });
}

// DELETE /api/products/:id — somente admin (soft delete)
export async function deleteProduct(req, res) {
  const { id } = req.params;

  await prisma.product.update({
    where: { id },
    data: { active: false },
  });

  res.status(204).send();
}
