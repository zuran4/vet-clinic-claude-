import { randomUUID } from "node:crypto";

import { requestContext } from "../utils/requestContext.js";

export default function attachRequestId(req, res, next) {
  const id = (req.headers["x-request-id"] || "").toString().trim() || randomUUID();
  req.requestId = id;
  res.setHeader("x-request-id", id);
  requestContext.run({ requestId: id }, next);
}
