import { Router } from "express";
import {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  loginRateLimit,
  registerRateLimit,
  forgotPasswordRateLimit,
} from "../middleware/rateLimit.js";

const router = Router();

router.post("/register", registerRateLimit, asyncHandler(register));
router.post("/login", loginRateLimit, asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(me));
router.post("/forgot-password", forgotPasswordRateLimit, asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword));

export default router;