import { signToken } from "../../utils/jwt.js";
import { rotateRefreshToken, generateRefreshToken, saveRefreshToken } from "../../services/auth/tokenService.js";
import { getPermissions } from "../../config/roles.js";
import { getTenantModels } from "../../services/tenantConnectionManager.js";
import { getTenantModel } from "../../services/adminConnection.js";

export async function refresh(req, res, next) {
  try {
    const { refreshToken, clinicId } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Απαιτείται refresh token" });
    }
    if (!clinicId) {
      return res.status(400).json({ message: "Απαιτείται clinicId" });
    }

    // Επαλήθευση ότι η κλινική υπάρχει και είναι ενεργή
    const Tenant = getTenantModel();
    const tenant = await Tenant.findOne({ clinicId, isActive: true }).lean();
    if (!tenant) {
      return res.status(401).json({ message: "Άγνωστο ή ανενεργό κτηνιατρείο" });
    }

    const { User, RefreshToken } = getTenantModels(clinicId);

    const userId = await rotateRefreshToken(refreshToken, RefreshToken);
    if (!userId) {
      return res.status(401).json({ message: "Μη έγκυρο ή ληγμένο refresh token" });
    }

    const user = await User.findOne({ _id: userId, isActive: true }).select("name role").lean();
    if (!user) {
      return res.status(401).json({ message: "Ο χρήστης δεν υπάρχει ή είναι ανενεργός" });
    }

    const newToken = signToken({ userId: user._id, name: user.name, role: user.role, clinicId });
    const newRawRefresh = generateRefreshToken();
    await saveRefreshToken(userId, newRawRefresh, RefreshToken);

    res.json({
      token: newToken,
      refreshToken: newRawRefresh,
      permissions: getPermissions(user.role),
    });
  } catch (error) {
    next(error);
  }
}
