import { Router } from "express";
import {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
} from "../controllers/wishlistController.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Todas as rotas de wishlist exigem usuário autenticado
router.use(requireAuth);

router.get("/", asyncHandler(getWishlist));
router.post("/", asyncHandler(addWishlistItem));
router.delete("/:productId", asyncHandler(removeWishlistItem));

export default router;