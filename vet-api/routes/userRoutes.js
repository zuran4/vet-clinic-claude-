import express from "express";

import User from "../models/User.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 🔐 GET /api/users – Λίστα χρηστών (μόνο για admin)
router.get("/", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const users = await User.find({}, "-pin"); // δεν στέλνουμε το PIN για ασφάλεια
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση χρηστών" });
  }
});

// 🔐 POST /api/users – Δημιουργία νέου χρήστη
router.post("/", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const { name, pin, role } = req.body;
  try {
    const existing = await User.findOne({ pin });
    if (existing) {
      return res.status(400).json({ message: "Υπάρχει ήδη χρήστης με αυτό το PIN" });
    }

    const newUser = new User({ name, pin, role });
    await newUser.save();

    res.status(201).json({ message: "Ο χρήστης δημιουργήθηκε!" });
  } catch (err) {
    res.status(500).json({ message: "Σφάλμα δημιουργίας χρήστη" });
  }
});

// 🔐 PUT /api/users/:id – Ενημέρωση χρήστη
router.put("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const { name, pin, role } = req.body;
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { name, pin, role },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Σφάλμα ενημέρωσης χρήστη" });
  }
});

// 🔐 DELETE /api/users/:id – Διαγραφή χρήστη
router.delete("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Ο χρήστης διαγράφηκε." });
  } catch (err) {
    res.status(500).json({ message: "Σφάλμα διαγραφής χρήστη" });
  }
});

export default router;
