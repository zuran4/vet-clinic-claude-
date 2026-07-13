import * as authService from "../../services/auth/authService.js";
import { recordAudit } from "../../services/audit/recordAudit.js";

const auditBase = (req) => ({
  resource: "auth",
  method: req.method,
  path: req.originalUrl,
  requestId: req.requestId || null,
  ip: req.ip,
});

export async function login(req, res, next) {
  try {
    const { clinicId, userId, pin } = req.body;

    if (!clinicId || !userId || !pin) {
      return res.status(400).json({ message: "clinicId, userId και pin είναι υποχρεωτικά." });
    }

    const result = await authService.loginWithPin(clinicId, pin, userId);
    if (!result) {
      recordAudit({ ...auditBase(req), action: "LOGIN_FAILURE", statusCode: 401 });
      return res.status(401).json({ message: "Μη έγκυρα στοιχεία" });
    }

    recordAudit({
      ...auditBase(req),
      action: "LOGIN_SUCCESS",
      statusCode: 200,
      userName: result.name,
      userRole: result.role,
    });
    res.json(result);
  } catch (error) { next(error); }
}
