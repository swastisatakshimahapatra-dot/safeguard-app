import express from "express";
import {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
} from "../controllers/contactController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getContacts);
router.post("/add", protect, addContact);
router.put("/:contactId", protect, updateContact);
router.delete("/:contactId", protect, deleteContact);

export default router;
