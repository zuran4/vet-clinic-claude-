import ApiError from "../../utils/apiError.js";
import config from "../../config/index.js";

// Service-to-service auth για /api/internal/* — π.χ. το control plane καλεί
// αυτά τα endpoints με ένα κοινό secret (X-Internal-Key), όχι με JWT κλινικής.
export default function requireServiceKey(req, res, next) {
  const key = req.headers["x-internal-key"];

  if (!config.internalApiKey || key !== config.internalApiKey) {
    return next(ApiError.unauthorized("Μη έγκυρο internal API key."));
  }

  next();
}
