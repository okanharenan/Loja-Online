import { Router } from "express";
import {
  createOrder,
  listOrders,
  getOrder,
} from "../controllers/orderController.js";
import { createOrderPayment } from "../controllers/paymentController.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/", asyncHandler(createOrder));
router.get("/", asyncHandler(listOrders));
router.get("/:id", asyncHandler(getOrder));
router.post("/:id/payment", asyncHandler(createOrderPayment));

export default router;