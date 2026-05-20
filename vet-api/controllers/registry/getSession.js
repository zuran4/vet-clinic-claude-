// vet-api/controllers/registry/getSession.js

import logger from "../../utils/logger.js";
import { getRegistrySession } from "../../services/registryWorkerClient.js";

/**
 * GET /api/registry/session
 */
export async function getSession(req, res, next) {
  const requestId = req.requestId || req.headers["x-request-id"];

  try {
    const data = await getRegistrySession({ requestId });

    // Το getRegistrySession κάνει soft-fail και επιστρέφει ok:false όταν είναι offline/timeout/http error.
    // Εδώ σεβόμαστε αυτό το σήμα ώστε το UI να καταλάβει την πραγματική κατάσταση.
    return res.json({
      ok: Boolean(data.ok),
      status: data.status,
      url: data.url,
      worker: data.raw || null,
      requestId,
    });
  } catch (err) {
    logger.error({
      msg: "Failed to fetch registry session from worker",
      requestId,
      error: err?.message,
      stack: err?.stack,
    });

    // Normalize to ApiError via errorHandler if not already
    if (!err.statusCode) err.statusCode = 503;
    return next(err);
  }
}
