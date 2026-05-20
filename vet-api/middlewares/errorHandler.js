// vet-api/middlewares/errorHandler.js
import logger from "../utils/logger.js";

function normalizeError(err, req) {
  const requestId = req?.requestId || null;

  // Default
  let httpStatus = err?.httpStatus || err?.statusCode || err?.status || 500;
  let code = err?.code || "INTERNAL_ERROR";
  let message = err?.message || "Κάτι πήγε στραβά.";
  let details = undefined;

  // Express JSON parse error (invalid JSON body)
  // Συνήθως: err.type === 'entity.parse.failed'
  if (err?.type === "entity.parse.failed") {
    httpStatus = 400;
    code = "INVALID_JSON_BODY";
    message = "Μη έγκυρο JSON στο request body.";
  }

  // Mongoose validation error
  if (err?.name === "ValidationError") {
    httpStatus = 400;
    code = "VALIDATION_ERROR";
    message = "Αποτυχία επικύρωσης δεδομένων.";
    details = Object.values(err.errors || {})
      .map((e) => e?.message)
      .filter(Boolean);
  }

  // Mongo duplicate key
  if (err?.code === 11000) {
    httpStatus = 409;
    code = "DUPLICATE_KEY";
    message = "Υπάρχει ήδη εγγραφή με τα ίδια στοιχεία.";
    details = err?.keyValue || undefined;
  }

  // JWT / auth
  if (err?.name === "UnauthorizedError") {
    httpStatus = 401;
    code = "UNAUTHORIZED";
    message = "Μη εξουσιοδοτημένη πρόσβαση.";
  }

  // Αν έρχονται upstream errors από registry worker / services
  // και δεν έχουν httpStatus, δίνουμε sensible 502 αντί για 500.
  if (
    (code === "REGISTRY_OK_FALSE" || code === "REGISTRY_WORKER_UNREACHABLE") &&
    (!err?.httpStatus && httpStatus === 500)
  ) {
    httpStatus = 502;
  }

  // Guarantee requestId on the payload even if err.requestId exists
  const rid = err?.requestId || requestId;

  return { httpStatus, code, message, requestId: rid, details };
}

export default function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const { httpStatus, code, message, requestId, details } = normalizeError(err, req);

  logger.error("API Error", {
    requestId,
    code,
    httpStatus,
    path: req?.originalUrl,
    method: req?.method,
    message,
    stack: err?.stack,
    details,
  });

  return res.status(httpStatus).json({
    ok: false,
    error: {
      code,
      message,
      requestId,
    },
    meta: {
      path: req?.originalUrl,
      method: req?.method,
    },
    ...(details !== undefined ? { details } : {}),
  });
}
