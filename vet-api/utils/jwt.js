import jwt from "jsonwebtoken";

import config from "../config/index.js"; // να επιστρέφει { jwtSecret }

export function signToken(payload, options = {}) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn, ...options });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
