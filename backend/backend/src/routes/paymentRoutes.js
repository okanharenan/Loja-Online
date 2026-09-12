import { Router } from "express";
import { handlePaymentWebhook } from "../controllers/paymentController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.post("/webhook", asyncHandler(handlePaymentWebhook));

export default router;