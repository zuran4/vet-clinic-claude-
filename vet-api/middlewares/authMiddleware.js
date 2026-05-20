import jwt from "jsonwebtoken";

import config from "../config/index.js";
import logger from "../utils/logger.js";

// ✅ Βασικός έλεγχος εγκυρότητας token
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("🚫 Απόπειρα πρόσβασης χωρίς token", {
      path: req.originalUrl,
      method: req.method,
    });
    return res.status(401).json({ message: "Απαιτείται έλεγχος ταυτότητας" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // περιέχει { userId, role, name, ... }
    logger.info(`🔑 Επαληθεύτηκε token για χρήστη: ${decoded.name || decoded.userId}`);
    next();
  } catch (err) {
    logger.warn("⚠️ Μη έγκυρο token", {
      path: req.originalUrl,
      method: req.method,
    });
    return res.status(403).json({ message: "Μη έγκυρο token" });
  }
};

// ✅ Έλεγχος ρόλων
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      logger.warn("🚫 Απαγορευμένη πρόσβαση", {
        path: req.originalUrl,
        method: req.method,
        user: req.user?.role || "unknown",
      });
      return res
        .status(403)
        .json({ message: "Δεν έχετε δικαίωμα πρόσβασης σε αυτήν τη λειτουργία" });
    }
    next();
  };
};
