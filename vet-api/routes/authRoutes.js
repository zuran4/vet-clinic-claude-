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

export default router;
