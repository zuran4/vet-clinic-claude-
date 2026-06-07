import * as Sentry from "@sentry/node";
import { verifyToken } from "../../utils/jwt.js";

export default function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const [, token] = auth.split(" ");

  if (!token) {
    return res.status(401).json({ message: "Απαιτείται σύνδεση" });
  }
  try {
    const payload = verifyToken(token);
    req.user = payload; // { userId, name, role }

    // Εμπλουτίζει τυχόν Sentry event από αυτό το request με τον χρήστη
    Sentry.setUser({ id: payload?.userId, username: payload?.name, role: payload?.role });

    next();
  } catch {
    return res.status(401).json({ message: "Μη έγκυρο ή ληγμένο token" });
  }
}
