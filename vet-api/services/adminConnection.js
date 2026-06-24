import mongoose from "mongoose";
import { tenantSchema } from "../models/Tenant.js";
import logger from "../utils/logger.js";

let adminConn = null;
let Tenant = null;

export async function connectAdmin(uri) {
  if (adminConn) return adminConn;

  adminConn = await mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 10000,
  }).asPromise();

  Tenant = adminConn.model("Tenant", tenantSchema);

  adminConn.on("error", (err) =>
    logger.error("❌ Admin DB error:", err.message)
  );

  logger.info("✅ Admin DB (vetAdmin) connected.");
  return adminConn;
}

export function getTenantModel() {
  if (!Tenant) throw new Error("Admin DB not connected yet.");
  return Tenant;
}

// Χρησιμοποιείται ΜΟΝΟ σε tests για να κάνει inject mock connection
export function _setForTest(conn, tenantModel) {
  adminConn = conn;
  Tenant    = tenantModel;
}
