import { listAuditLogs } from "../../services/audit/auditService.js";
import ApiError from "../../utils/apiError.js";

export async function getAuditLogs(req, res, next) {
  try {
    if (req.user?.role !== "admin") {
      return next(ApiError.forbidden("Μόνο διαχειριστές έχουν πρόσβαση στο audit log"));
    }

    const { page, pageSize, action, resource, userId } = req.query;
    const result = await listAuditLogs({ page, pageSize, action, resource, userId });

    res.json(result);
  } catch (error) {
    next(error);
  }
}
