import * as authService from "../../services/auth/authService.js";

export async function getStaff(req, res, next) {
  try {
    const clinicId = String(req.query.clinicId || "").trim().toLowerCase();
    if (!clinicId) {
      return res.status(400).json({ message: "Απαιτείται clinicId" });
    }

    const data = await authService.getActiveStaff(clinicId);
    if (!data) {
      return res.status(404).json({ message: "Άγνωστη ή ανενεργή κλινική" });
    }

    res.json(data);
  } catch (error) { next(error); }
}
