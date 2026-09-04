import { Router } from "express";
import { register, login, me } from "../controllers/authController.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { loginRateLimit, registerRateLimit } from "../middleware/rateLimit.js";

const router = Router();

router.post("/register", registerRateLimit, asyncHandler(register));
router.post("/login", loginRateLimit, asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(me));

export default router;