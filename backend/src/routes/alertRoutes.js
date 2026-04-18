import express from "express";
import {
  triggerAlert,
  getAlertHistory,
  getAlertById,
  deleteAlert,
  getFamilyAlerts,
} from "../controllers/alertController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/trigger", protect, triggerAlert);
router.get("/history", protect, getAlertHistory);
router.get("/family", protect, getFamilyAlerts);
router.delete("/delete/:id", protect, deleteAlert);
router.get("/:id", protect, getAlertById);

export default router;
