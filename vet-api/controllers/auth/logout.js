import { revokeRefreshToken } from "../../services/auth/tokenService.js";
import { getTenantModels } from "../../services/tenantConnectionManager.js";

export async function logout(req, res, next) {
  try {
    const { refreshToken, clinicId } = req.body;

    // Ανάκληση refresh token αν υπάρχει — αποτυχία δεν εμποδίζει logout
    if (refreshToken && clinicId) {
      const { RefreshToken } = getTenantModels(clinicId);
      await revokeRefreshToken(refreshToken, RefreshToken);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
