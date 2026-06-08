import mongoose from "mongoose";

// 📜 Audit trail: ποιος έκανε τι, πότε και σε ποιον πόρο.
// Append-only — δεν αναμένονται updates/deletes σε εγγραφές audit.
const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, index: true }, // CREATE | UPDATE | DELETE | LOGIN_SUCCESS | LOGIN_FAILURE
    resource: { type: String, index: true }, // π.χ. "customers", "appointments", "auth"
    resourceId: { type: String },

    method: { type: String },
    path: { type: String },
    statusCode: { type: Number },

    userId: { type: String, index: true },
    userName: { type: String },
    userRole: { type: String },

    requestId: { type: String },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
