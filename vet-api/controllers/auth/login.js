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
    const { clinicId, pin } = req.body;

    if (!clinicId || !pin) {
      return res.status(400).json({ message: "clinicId και pin είναι υποχρεωτικά." });
    }

    const result = await authService.loginWithPin(clinicId, pin);
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
