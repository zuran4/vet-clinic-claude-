import express from "express";
import mongoose from "mongoose";

import customerRoutes    from "../../routes/customers/index.js";
import authRoutes        from "../../routes/authRoutes.js";
import appointmentRoutes from "../../routes/appointments/index.js";
import productRoutes     from "../../routes/products/index.js";
import petRoutes         from "../../routes/pets/index.js";
import supplierRoutes    from "../../routes/supplierRoutes.js";
import reminderRoutes    from "../../routes/reminders.js";
import purchaseRoutes    from "../../routes/purchases.js";
import prescriptionRoutes from "../../routes/prescriptionRoutes.js";
import auditRoutes       from "../../routes/audit/index.js";
import uploadRoutes      from "../../routes/uploadRoutes.js";
import settingsRoutes    from "../../routes/settings.js";
import healthRoutes      from "../../routes/health.js";
import attachRequestId   from "../../middlewares/requestId.js";
import auditLog          from "../../middlewares/auditLog.js";
import errorHandler      from "../../middlewares/errorHandler.js";

// Επιστρέφει req.models από τη default mongoose σύνδεση (MongoMemoryServer στα tests)
function getTestModels() {
  return mongoose.models;
}

export function buildTestApp({ user = { userId: "tester", role: "admin", name: "Test User", clinicId: "test" } } = {}) {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(attachRequestId);

  // Προσομοίωση requireAuth + resolveTenant για tests
  app.use((req, _res, next) => {
    req.user   = user;
    req.models = getTestModels();
    next();
  });

  app.use(auditLog);

  app.use("/api/health",        healthRoutes);
  app.use("/api/customers",     customerRoutes);
  app.use("/api/appointments",  appointmentRoutes);
  app.use("/api/products",      productRoutes);
  app.use("/api/pets",          petRoutes);
  app.use("/api/suppliers",     supplierRoutes);
  app.use("/api/reminders",     reminderRoutes);
  app.use("/api/purchases",     purchaseRoutes);
  app.use("/api/prescriptions", prescriptionRoutes);
  app.use("/api/audit",         auditRoutes);
  app.use("/api/upload",        uploadRoutes);
  app.use("/api/settings",      settingsRoutes);

  app.use(errorHandler);

  return app;
}

// Auth test app — χρησιμοποιεί πραγματικό auth flow
// Το login δεν κάνει admin DB lookup σε test mode (χρησιμοποιεί default connection)
export function buildAuthTestApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  // Για το /me endpoint — inject user + models αν υπάρχει valid token
  app.use((req, _res, next) => {
    req.models = getTestModels();
    next();
  });

  app.use("/api/auth", authRoutes);
  app.use(errorHandler);

  return app;
}
