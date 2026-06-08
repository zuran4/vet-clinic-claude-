import { randomUUID } from "node:crypto";

import * as Sentry from "@sentry/node";

import { requestContext } from "../utils/requestContext.js";

export default function attachRequestId(req, res, next) {
  const id =
    (req.headers["x-request-id"] || "").toString().trim() ||
    (req.headers["x-correlation-id"] || "").toString().trim() ||
    randomUUID();

  req.requestId = id;
  res.setHeader("x-request-id", id);
  res.setHeader("X-Request-Id", id);

  Sentry.getCurrentScope().setTag("requestId", id);

  requestContext.run({ requestId: id }, next);
}
