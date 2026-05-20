import express from "express";

import validateBody from "../../validators/validateBody.js"; // ο generic validator που ήδη έχεις
import loginSchema from "../../validators/auth/loginSchema.js";
import { login } from "../../controllers/auth/login.js";
import { me } from "../../controllers/auth/me.js";
import requireAuth from "../../middlewares/auth/requireAuth.js";

const router = express.Router();

router.post("/login", validateBody(loginSchema), login);
router.get("/me", requireAuth, me);

export default router;
