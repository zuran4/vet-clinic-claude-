import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { createLogger, format, transports } from "winston";

import { getRequestId } from "./requestContext.js";

// ✅ Αντικατάσταση __dirname σε ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Δημιουργούμε φάκελο logs αν δεν υπάρχει
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const rid = getRequestId();
      const merged = rid ? { requestId: rid, ...meta } : meta;
      const extras = Object.keys(merged).length ? JSON.stringify(merged) : "";
      return `[${timestamp}] ${level.toUpperCase()}: ${message} ${extras}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(logDir, "app.log") }),
  ],
});

export default logger;
