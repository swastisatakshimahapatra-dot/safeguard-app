import express from "express";
import {
  getUnseenNearbyAlerts,
  getNearbyAlertHistory,
  markNearbyAlertSeen,
  takeHelperAction,
  deleteNearbyAlertHistory,
  getHelperActions,
} from "../controllers/nearbyAlertController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Dashboard - get unseen nearby alerts
router.get("/unseen", protect, getUnseenNearbyAlerts);

// ✅ Alert History Tab 2 - get received nearby alerts
router.get("/history", protect, getNearbyAlertHistory);

// ✅ Mark nearby alert as seen (removes from dashboard)
router.put("/mark-seen/:nearbyAlertId", protect, markNearbyAlertSeen);

// ✅ Take helper action (called_police or going_to_help)
router.post("/helper-action", protect, takeHelperAction);

// ✅ Delete from history (manual)
router.delete("/history/:historyId", protect, deleteNearbyAlertHistory);

// ✅ Get helper actions for an alert (victim view)
router.get("/helpers/:alertId", protect, getHelperActions);

export default router;
