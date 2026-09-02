import { Router } from "express";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Rotas públicas — qualquer visitante pode ver os produtos
router.get("/", asyncHandler(listProducts));
router.get("/:idOrSlug", asyncHandler(getProduct));

// Rotas protegidas — só admin pode gerenciar o catálogo
router.post("/", requireAuth, requireAdmin, asyncHandler(createProduct));
router.put("/:id", requireAuth, requireAdmin, asyncHandler(updateProduct));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteProduct));

export default router;
