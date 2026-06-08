import express from "express";

import customerRoutes from "../../routes/customers/index.js";
import authRoutes from "../../routes/authRoutes.js";
import appointmentRoutes from "../../routes/appointments/index.js";
import productRoutes from "../../routes/products/index.js";
import petRoutes from "../../routes/pets/index.js";
import supplierRoutes from "../../routes/supplierRoutes.js";
import reminderRoutes from "../../routes/reminders.js";
import purchaseRoutes from "../../routes/purchases.js";
import prescriptionRoutes from "../../routes/prescriptionRoutes.js";
import auditRoutes from "../../routes/audit/index.js";
import healthRoutes from "../../routes/health.js";
import attachRequestId from "../../middlewares/requestId.js";
import auditLog from "../../middlewares/auditLog.js";
import errorHandler from "../../middlewares/errorHandler.js";

// Ελαφρύ Express app με ό,τι χρειάζονται τα domain modules: πραγματικά
// routes/controllers/validators/middlewares (incl. auditLog), χωρίς
// Sentry/Redis/Socket.io που στήνει ολόκληρο το server.js.
// `user` προσομοιώνει το αποτέλεσμα του requireAuth (προεπιλογή: admin).
export function buildTestApp({ user = { userId: "tester", role: "admin", name: "Test User" } } = {}) {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(attachRequestId);

  app.use((req, _res, next) => {
    req.user = user;
    next();
  });

  app.use(auditLog);

  app.use("/api/health", healthRoutes);
  app.use("/api/customers", customerRoutes);
  app.use("/api/appointments", appointmentRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/pets", petRoutes);
  app.use("/api/suppliers", supplierRoutes);
  app.use("/api/reminders", reminderRoutes);
  app.use("/api/purchases", purchaseRoutes);
  app.use("/api/prescriptions", prescriptionRoutes);
  app.use("/api/audit", auditRoutes);

  app.use(errorHandler);

  return app;
}

// Express app με τα πραγματικά, mounted /api/auth routes (routes/authRoutes.js —
// login + requireAuth-protected /me + brute-force rate limiter), χωρίς fake-user
// injection: εδώ θέλουμε να ελέγξουμε την πραγματική auth ροή ακριβώς όπως τρέχει
// στο server.js (ΟΧΙ το ορφανό routes/auth/index.js, που λείπει ο rate limiter).
export function buildAuthTestApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use("/api/auth", authRoutes);
  app.use(errorHandler);

  return app;
}
