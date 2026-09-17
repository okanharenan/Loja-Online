import { Router } from "express";
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listAddresses));
router.post("/", asyncHandler(createAddress));
router.put("/:id", asyncHandler(updateAddress));
router.delete("/:id", asyncHandler(deleteAddress));

export default router;