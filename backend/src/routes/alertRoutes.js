import express from "express";
import {
  triggerAlert,
  getAlertHistory,
  getAlertById,
} from "../controllers/alertController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ All protected
router.post("/trigger", protect, triggerAlert);
router.get("/history", protect, getAlertHistory);
router.get("/:id", protect, getAlertById);

export default router;
