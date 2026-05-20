import * as authService from "../../services/auth/authService.js";

export async function login(req, res, next) {
  try {
    const { pin } = req.body;
    const result = await authService.loginWithPin(pin);
    if (!result) {
      return res.status(401).json({ message: "Μη έγκυρα στοιχεία" });
    }
    res.json(result);
  } catch (error) { next(error); }
}
