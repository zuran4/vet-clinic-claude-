import mongoose from "mongoose";

import { customerSchema }            from "../models/Customer.js";
import { petSchema }                 from "../models/Pet.js";
import { userSchema }                from "../models/User.js";
import { productSchema }             from "../models/Product.js";
import { appointmentSchema }         from "../models/appointmentModel.js";
import { auditLogSchema }            from "../models/AuditLog.js";
import { prescriptionSchema }        from "../models/Prescription.js";
import { purchaseSchema }            from "../models/Purchase.js";
import { refreshTokenSchema }        from "../models/RefreshToken.js";
import { reminderSchema }            from "../models/Reminder.js";
import { supplierSchema }            from "../models/Supplier.js";
import { settingsSchema }            from "../models/Settings.js";
import { registrySearchHistorySchema } from "../models/RegistrySearchHistory.js";
import { messageSchema }             from "../models/Message.js";
import logger                        from "../utils/logger.js";

// Χάρτης clinicId → mongoose.Connection (lazy, ανά αίτημα)
const pool = new Map();

// Αντικαθιστά το DB name στο URI διατηρώντας τα query params
function buildUri(baseUri, dbName) {
  return baseUri.replace(/\/([^/?]+)(\?.*)?$/, `/${dbName}$2`);
}

// Επιστρέφει (ή δημιουργεί) τη σύνδεση για μία κλινική
export function getTenantConnection(clinicId) {
  if (pool.has(clinicId)) return pool.get(clinicId);

  const dbName = `vetClinic_${clinicId}`;
  const uri = buildUri(process.env.MONGO_URI, dbName);

  const conn = mongoose.createConnection(uri, { serverSelectionTimeoutMS: 10000 });

  conn.on("connected", () => logger.info(`✅ Tenant DB connected: ${dbName}`));
  conn.on("error",     (err) => logger.error(`❌ Tenant DB error [${dbName}]:`, err.message));

  pool.set(clinicId, conn);
  return conn;
}

// Επιστρέφει όλα τα models δεμένα στη σωστή tenant connection
export function getTenantModels(clinicId) {
  const conn = getTenantConnection(clinicId);

  // conn.models cache — αποφεύγουμε επαναεγγραφή schema
  function m(name, schema) {
    return conn.models[name] ?? conn.model(name, schema);
  }

  return {
    Customer:              m("Customer",              customerSchema),
    Pet:                   m("Pet",                   petSchema),
    User:                  m("User",                  userSchema),
    Product:               m("Product",               productSchema),
    Appointment:           m("Appointment",           appointmentSchema),
    AuditLog:              m("AuditLog",              auditLogSchema),
    Prescription:          m("Prescription",          prescriptionSchema),
    Purchase:              m("Purchase",              purchaseSchema),
    RefreshToken:          m("RefreshToken",          refreshTokenSchema),
    Reminder:              m("Reminder",              reminderSchema),
    Supplier:              m("Supplier",              supplierSchema),
    Settings:              m("Settings",              settingsSchema),
    RegistrySearchHistory: m("RegistrySearchHistory", registrySearchHistorySchema),
    Message:               m("Message",               messageSchema),
  };
}

// Κλείνει όλες τις συνδέσεις (για graceful shutdown)
export async function closeAllTenantConnections() {
  await Promise.all([...pool.values()].map((c) => c.close()));
  pool.clear();
}

// Χρησιμοποιείται ΜΟΝΟ σε tests για να κάνει inject υπάρχουσα connection
export function _setConnectionForTest(clinicId, conn) {
  pool.set(clinicId, conn);
}
