import AuditLog from "../../models/AuditLog.js";

/**
 * Σελιδοποιημένη λίστα audit εγγραφών, με προαιρετικά φίλτρα.
 * Ταξινόμηση πάντα από την πιο πρόσφατη ενέργεια προς τα πίσω.
 */
export async function listAuditLogs({ page = 1, pageSize = 20, action, resource, userId } = {}) {
  const query = {};
  if (action) query.action = action;
  if (resource) query.resource = resource;
  if (userId) query.userId = userId;

  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safePageSize = Math.min(Math.max(Number.parseInt(pageSize, 10) || 20, 1), 100);
  const skip = (safePage - 1) * safePageSize;

  const [total, data] = await Promise.all([
    AuditLog.countDocuments(query),
    AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(safePageSize).lean(),
  ]);

  return {
    data,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(total / safePageSize),
  };
}
