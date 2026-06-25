// vet-api/routes/authRoutes.js
import express from "express";
import { rateLimit } from "express-rate-limit";

import validateBody from "../validators/validateBody.js";
import loginSchema from "../validators/auth/loginSchema.js";
import { login } from "../controllers/auth/login.js";
import { me } from "../controllers/auth/me.js";
import { refresh } from "../controllers/auth/refresh.js";
import { logout } from "../controllers/auth/logout.js";
import requireAuth from "../middlewares/auth/requireAuth.js";
import { getTenantModels } from "../services/tenantConnectionManager.js";
import { comparePin, hashPin } from "../services/auth/pinCrypto.js";

const router = express.Router();

// 🔒 Αυστηρό rate limit ειδικά για login — προστασία από brute-force
// Μέγιστο 10 αποτυχημένες/επιτυχημένες προσπάθειες ανά 15 λεπτά ανά IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 λεπτά
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // μετράμε ΜΟΝΟ αποτυχίες
  message: {
    ok: false,
    error: {
      code: "TOO_MANY_LOGIN_ATTEMPTS",
      message: "Πάρα πολλές αποτυχημένες προσπάθειες. Δοκίμασε ξανά σε 15 λεπτά.",
    },
  },
});

router.post("/login", loginLimiter, validateBody(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

// 🔒 Αλλαγή PIN — απαιτεί σύνδεση
router.post("/change-pin", requireAuth, async (req, res) => {
  try {
    const { oldPin, newPin } = req.body;
    if (!oldPin || !newPin) return res.status(400).json({ error: "Απαιτούνται oldPin και newPin." });
    if (String(newPin).length < 4) return res.status(400).json({ error: "Το νέο PIN πρέπει να έχει τουλάχιστον 4 ψηφία." });

    const { User } = getTenantModels(req.user.clinicId);
    const user = await User.findById(req.user.userId).select("pinHash").lean();
    if (!user) return res.status(404).json({ error: "Ο χρήστης δεν βρέθηκε." });

    const valid = await comparePin(String(oldPin), user.pinHash);
    if (!valid) return res.status(401).json({ error: "Λανθασμένο τρέχον PIN." });

    const newHash = await hashPin(String(newPin));
    await User.findByIdAndUpdate(req.user.userId, { pinHash: newHash });

    res.json({ ok: true, message: "Το PIN άλλαξε επιτυχώς." });
  } catch (err) {
    res.status(500).json({ error: "Σφάλμα αλλαγής PIN." });
  }
});

export default router;
