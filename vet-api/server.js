import http from "http";
import path from "path";
import { fileURLToPath } from "url";

import * as Sentry from "@sentry/node";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { Server } from "socket.io";

import settingsRoutes from "./routes/settings.js";
import config from "./config/index.js";
import logger from "./utils/logger.js";
import requireAuth from "./middlewares/auth/requireAuth.js";
import auditLog from "./middlewares/auditLog.js";
import auditRoutes from "./routes/audit/index.js";
import authRoutes from "./routes/authRoutes.js";
import appointmentRoutes from "./routes/appointments/index.js";
import productRoutes from "./routes/products/index.js";
import customerRoutes from "./routes/customers/index.js";
import petRoutes from "./routes/pets/index.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import purchaseRoutes from "./routes/purchases.js";
import reminderRoutes from "./routes/reminders.js";
import exportRoutes from "./routes/export.js";
import registryRoutes from "./routes/registry/index.js";
import healthRoutes from "./routes/health.js";
import attachRequestId from "./middlewares/requestId.js";
import errorHandler from "./middlewares/errorHandler.js";
import { startAppointmentReminderJob } from "./jobs/appointmentReminder.js";
import { startPetVaccinationJob } from "./jobs/petVaccinationJob.js";
import { startProductExpirationJob } from "./jobs/productExpirationJob.js";
import { startPurchaseReminderJob } from "./jobs/purchaseReminderJob.js";

// ==============================
// 📁 Path Setup for ES Modules
// ==============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

logger.info(`🚀 Starting Vet API from ${__dirname}`);

const app = express();
const server = http.createServer(app);

// ==============================
// 🌍 Allowed Origins (κοινό για CORS + Socket.io)
// ==============================
const devFallbackOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const allowedOrigins =
  config.corsOrigins.length > 0
    ? [...config.corsOrigins, ...devFallbackOrigins]
    : devFallbackOrigins;

// Σε development, επιτρέπουμε επίσης πρόσβαση από συσκευές του τοπικού δικτύου
// (π.χ. κινητό στο ίδιο Wi-Fi) που ανοίγουν το frontend μέσω LAN IP.
const lanOriginPattern = /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):5173$/;

function corsOriginCheck(origin, callback) {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  if (config.isDev && lanOriginPattern.test(origin)) return callback(null, true);
  return callback(new Error(`CORS blocked for origin: ${origin}`), false);
}

// ==============================
// 🔌 Socket.io
// ==============================
const io = new Server(server, {
  cors: {
    origin: corsOriginCheck,
    methods: ["GET", "POST"],
  },
});

// Export io globally (optional pattern)
global.io = io;
global.emitAlert = (data) => io.emit("alert", data);

// ==============================
// 🧰 Middleware
// ==============================
app.disable("x-powered-by");
app.set("trust proxy", 1);

// ✅ Security headers (API-friendly)
app.use(
  helmet({
    contentSecurityPolicy: false,

    // Επιτρέπει cross-origin fetch από το frontend origin
    crossOriginResourcePolicy: { policy: "cross-origin" },

    // Ασφαλές για dev: αποφεύγει περιπτώσεις που “σφίγγουν” τα embeds/requests
    crossOriginEmbedderPolicy: false,
  })
);


// ==============================
// 🌍 CORS
// ==============================
const corsOptions = {
  origin: corsOriginCheck,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(attachRequestId);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==============================
// 🚦 Rate Limiting
// ==============================
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
  handler: (req, res) => {
    const requestId = req.requestId || null;
    return res.status(429).json({
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: "Πολλά αιτήματα. Δοκίμασε ξανά σε λίγο.",
        requestId,
      },
      meta: {
        path: req.originalUrl,
        method: req.method,
      },
    });
  },
});

app.use(limiter);

// ==============================
// 🏥 Health check — unauthenticated, before the auth guard
// ==============================
app.use("/api/health", healthRoutes);

// ==============================
// 🔐 Auth Guard — προστατεύει όλα τα /api/* εκτός από /api/auth και /api/health
// ==============================
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth") || req.path.startsWith("/health")) return next();
  return requireAuth(req, res, next);
});

// ==============================
// 📜 Audit Log — καταγράφει αυτόματα CREATE/UPDATE/DELETE σε /api/* (εκτός /auth,
// που καταγράφεται ξεχωριστά μέσα στο login controller)
// ==============================
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth") || req.path.startsWith("/health")) return next();
  return auditLog(req, res, next);
});

// ==============================
// 🧭 Routes
// ==============================
app.use("/api/settings", settingsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/registry", registryRoutes);
app.use("/api/export", exportRoutes);

// ==============================
// 🌐 Health Check
// ==============================
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "🐾 Vet API λειτουργεί κανονικά!",
    time: new Date().toISOString(),
    requestId: req.requestId,
  });
});

app.get("/health", (req, res) => res.json({ ok: true, requestId: req.requestId }));

// ==============================
// 🧭 404 Not Found (πριν το errorHandler)
// ==============================
app.use((req, res) => {
  const requestId = req.requestId || null;

  return res.status(404).json({
    ok: false,
    error: {
      code: "NOT_FOUND",
      message: "Το endpoint δεν βρέθηκε.",
      requestId,
    },
    meta: {
      path: req.originalUrl,
      method: req.method,
    },
  });
});

// ==============================
// 🛰️ Sentry — στέλνει στο dashboard κάθε unhandled / 5xx error
// (πρέπει να μπει ΠΡΙΝ από το δικό μας errorHandler)
// ==============================
Sentry.setupExpressErrorHandler(app);

// ==============================
// 🧰 Error Handler (τελευταίος πάντα)
// ==============================
app.use(errorHandler);

// ==============================
// 🗄️ MongoDB Connection
// ==============================
mongoose.set("strictQuery", true);

mongoose
  .connect(config.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    logger.info("✅ Συνδέθηκε με MongoDB!");
    server.listen(config.port, () => {
      logger.info(`✅ Server running on port ${config.port}`);
    });

    startAppointmentReminderJob();
    startPetVaccinationJob();
    startProductExpirationJob();
    startPurchaseReminderJob();
    logger.info("✅ Cron jobs ξεκίνησαν.");
  })
  .catch((err) => {
    logger.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ==============================
// 🧹 Graceful shutdown
// ==============================
process.on("SIGINT", async () => {
  logger.warn("🛑 SIGINT received. Closing MongoDB connection...");
  await mongoose.connection.close();
  logger.warn("✅ MongoDB connection closed. Exiting...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.warn("🛑 SIGTERM received. Closing MongoDB connection...");
  await mongoose.connection.close();
  logger.warn("✅ MongoDB connection closed. Exiting...");
  process.exit(0);
});