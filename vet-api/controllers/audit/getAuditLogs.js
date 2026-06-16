import { listAuditLogs } from "../../services/audit/auditService.js";

export async function getAuditLogs(req, res, next) {
  try {
    const { page, pageSize, action, resource, userId } = req.query;
    const result = await listAuditLogs({ page, pageSize, action, resource, userId });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
