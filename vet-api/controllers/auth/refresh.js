import User from "../../models/User.js";
import { signToken } from "../../utils/jwt.js";
import { rotateRefreshToken, generateRefreshToken, saveRefreshToken } from "../../services/auth/tokenService.js";
import { getPermissions } from "../../config/roles.js";

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: "Απαιτείται refresh token" });
    }

    const userId = await rotateRefreshToken(refreshToken);
    if (!userId) {
      return res.status(401).json({ message: "Μη έγκυρο ή ληγμένο refresh token" });
    }

    const user = await User.findOne({ _id: userId, isActive: true }).select("name role").lean();
    if (!user) {
      return res.status(401).json({ message: "Ο χρήστης δεν υπάρχει ή είναι ανενεργός" });
    }

    const newToken = signToken({ userId: user._id, name: user.name, role: user.role });
    const newRawRefresh = generateRefreshToken();
    await saveRefreshToken(userId, newRawRefresh);

    res.json({ token: newToken, refreshToken: newRawRefresh, permissions: getPermissions(user.role) });
  } catch (error) {
    next(error);
  }
}
