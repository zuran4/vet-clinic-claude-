import jwt from "jsonwebtoken";

import config from "../config/index.js"; // να επιστρέφει { jwtSecret }

export function signToken(payload, options = {}) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "12h", ...options });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
