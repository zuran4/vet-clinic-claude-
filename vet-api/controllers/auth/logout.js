import { revokeRefreshToken } from "../../services/auth/tokenService.js";

export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
