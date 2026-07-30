// vet-api/controllers/registry/getSession.js

import logger from "../../utils/logger.js";
import { getRegistrySession } from "../../services/registryWorkerClient.js";
import { startRegistryWorkerProcess } from "../../services/registryWorkerLauncher.js";
import { isRegistryWorkerRunning } from "../../services/registryWorkerProcess.js";

/**
 * GET /api/registry/session
 */
export async function getSession(req, res, next) {
  const requestId = req.requestId || req.headers["x-request-id"];
  const clinicId = req.clinicId;

  try {
    const data = await getRegistrySession(clinicId, { requestId });

    // Auto-start: μόνο αν ο worker είναι ΠΡΑΓΜΑΤΙΚΑ μη προσβάσιμος (OFFLINE/TIMEOUT)
    // ΚΑΙ δεν τον έχουμε ήδη spawn-άρει εμείς — αλλιώς θα ξαναπροσπαθούσαμε να
    // ανοίξουμε νέο process σε port που ήδη χρησιμοποιεί κάποιος άλλος (π.χ. ένας
    // ήδη τρέχων process εκτός αυτού του tracking, χωρίς λόγο).
    const unreachable = !data.ok && (data.status === "OFFLINE" || data.status === "TIMEOUT");
    if (unreachable && !isRegistryWorkerRunning(clinicId)) {
      startRegistryWorkerProcess({ clinicId, requestId }).catch((err) => {
        logger.warn({
          msg: "Auto-start registry worker failed",
          clinicId,
          requestId,
          error: err?.message,
        });
      });
    }

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
