// validators/validateBody.js (ESM)
// Generic Joi validator middleware για Express

import { reportEvent } from "../services/controlPlaneReporter.js";

export default function validateBody(schema) {
  return async function (req, res, next) {
    try {
      // allowUnknown: true ώστε να μην σπάει σε extra fields αν δεν σε ενοχλεί
      // abortEarly: false για να επιστρέφουμε όλα τα λάθη
      const value = await schema.validateAsync(req.body, {
        allowUnknown: true,
        abortEarly: false,
        stripUnknown: false,
      });
      req.body = value;
      next();
    } catch (err) {
      const details = err?.details?.map(d => d.message) || ["Invalid request body"];
      reportEvent({
        clinicId: req.clinicId,
        type: "validation_failed",
        severity: "warning",
        message: `Σφάλμα επικύρωσης στο ${req.originalUrl}: ${details.join(", ")}`,
        source: "backend",
        meta: { path: req.originalUrl, method: req.method, requestId: req.requestId, errors: details },
      });
      return res.status(400).json({
        message: "Σφάλμα επικύρωσης δεδομένων",
        errors: details,
      });
    }
  };
}
