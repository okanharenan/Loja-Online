import { Router } from "express";
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
} from "../controllers/cartController.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Todas as rotas do carrinho exigem usuário autenticado
router.use(requireAuth);

router.get("/", asyncHandler(getCart));
router.post("/", asyncHandler(addItem));
router.put("/:itemId", asyncHandler(updateItem));
router.delete("/:itemId", asyncHandler(removeItem));

export default router;
