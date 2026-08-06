import * as authService from "../../services/auth/authService.js";
import logger from "../../utils/logger.js";

export async function getStaff(req, res, next) {
  try {
    const clinicId = String(req.query.clinicId || "").trim().toLowerCase();
    if (!clinicId) {
      return res.status(400).json({ message: "Απαιτείται clinicId" });
    }

    const data = await authService.getActiveStaff(clinicId);
    if (!data) {
      logger.warn(`⚠️ Απόπειρα login σε άγνωστο/ανενεργό κτηνιατρείο: ${clinicId}`, { requestId: req.requestId });
      return res.status(404).json({ message: "Άγνωστο ή ανενεργό κτηνιατρείο" });
    }

    res.json(data);
  } catch (error) { next(error); }
}
