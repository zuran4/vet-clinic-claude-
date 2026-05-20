class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status
   * @param {string} message - human readable message
   * @param {object} [options]
   * @param {string}  [options.code] - stable machine-readable error code
   * @param {any}     [options.details] - optional extra info (do not put secrets)
   * @param {boolean} [options.isOperational] - expected/handled error
   * @param {boolean} [options.expose] - if true, message may be returned to client in production
   */
  constructor(statusCode, message, options = {}) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.status = statusCode; // compatibility alias

    this.code = options.code || "API_ERROR";
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;

    // Enterprise default: do not expose internal messages in prod
    this.expose = options.expose === true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", details) {
    return new ApiError(400, message, {
      code: "BAD_REQUEST",
      details,
      expose: true,
    });
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message, { code: "UNAUTHORIZED", expose: true });
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message, { code: "FORBIDDEN", expose: true });
  }

  static notFound(message = "Not found") {
    return new ApiError(404, message, { code: "NOT_FOUND", expose: true });
  }

  static conflict(message = "Conflict", details) {
    return new ApiError(409, message, {
      code: "CONFLICT",
      details,
      expose: true,
    });
  }
}

export default ApiError;
