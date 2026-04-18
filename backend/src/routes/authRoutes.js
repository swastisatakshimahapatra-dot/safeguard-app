import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  updateSettings,
  clearAlertHistory,
  deleteAccount,
  getLinkedUsers,
  unlinkUser,
  sendLinkRequest,
  getPendingRequests,
  respondToLinkRequest,
  getSentRequests,
  verifyEmail,
  sendVerificationEmailHandler,
  checkEmailRoute,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.put("/settings", protect, updateSettings);
router.delete("/clear-alerts", protect, clearAlertHistory);
router.delete("/delete-account", protect, deleteAccount);

// Family routes
router.get("/linked-users", protect, getLinkedUsers);
router.delete("/unlink-user/:userId", protect, unlinkUser);

// ✅ Link request routes
router.post("/link-request/send", protect, sendLinkRequest);
router.get("/link-request/pending", protect, getPendingRequests);
router.get("/link-request/sent", protect, getSentRequests);
router.post("/link-request/respond", protect, respondToLinkRequest);
router.get("/verify-email/:token", verifyEmail);
router.post("/send-verification", sendVerificationEmailHandler);
router.post("/check-email", checkEmailRoute);

export default router;
