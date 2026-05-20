import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import settingsRoutes from "./routes/settings.js";
import crypto from "crypto";

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Server } from "socket.io";

import config from "./config/index.js";
import logger from "./utils/logger.js";

import requireAuth from "./middlewares/auth/requireAuth.js";
import authRoutes from "./routes/authRoutes.js";
import appointmentRoutes from "./routes/appointments/index.js";
import productRoutes from "./routes/products/index.js";
import customerRoutes from "./routes/customers/index.js";
import petRoutes from "./routes/pets/index.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import purchaseRoutes from "./routes/purchases.js";
import registryRoutes from "./routes/registry/index.js";

import errorHandler from "./middlewares/errorHandler.js";

import { startAppointmentReminderJob } from "./jobs/appointmentReminder.js";
import { startPetVaccinationJob } from "./jobs/petVaccinationJob.js";
import { startProductExpirationJob } from "./jobs/productExpirationJob.js";

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
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const allowedOrigins =
  config.corsOrigins.length > 0
    ? [...config.corsOrigins, ...devFallbackOrigins]
    : devFallbackOrigins;

// ==============================
// 🔌 Socket.io
// ==============================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
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


// ✅ Global request id middleware (enterprise tracing)
app.use((req, res, next) => {
  const requestId =
    (req.headers["x-request-id"] || "").toString().trim() ||
    (req.headers["x-correlation-id"] || "").toString().trim() ||
    crypto.randomUUID();

  req.requestId = requestId;

  // Header και σε lowercase και σε canonical μορφή (enterprise friendly)
  res.setHeader("x-request-id", requestId);
  res.setHeader("X-Request-Id", requestId);

  next();
});

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
function corsOriginCheck(origin, callback) {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  return callback(new Error(`CORS blocked for origin: ${origin}`), false);
}

const corsOptions = {
  origin: corsOriginCheck,
  credentials: true,
};

app.use(cors(corsOptions));

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
// 🔐 Auth Guard — προστατεύει όλα τα /api/* εκτός από /api/auth
// ==============================
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth")) return next();
  return requireAuth(req, res, next);
});

// ==============================
// 🧭 Routes
// ==============================
app.use("/api/settings", settingsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/registry", registryRoutes);

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