// ===============================================
// 📄 getAllUsers.js
// Περιγραφή: Επιστρέφει όλους τους χρήστες της κλινικής (χωρίς pinHash)
// ===============================================

export const getAllUsers = async (req, res, next) => {
  try {
    const { User } = req.models;
    const users = await User.find({}, { pinHash: 0 }).sort({ createdAt: 1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};
