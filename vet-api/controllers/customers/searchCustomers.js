// ===============================================
// 📄 controllers/customers/searchCustomers.js
// Περιγραφή: Αναζήτηση πελατών (σταθερό schema για UI)
// ===============================================

import Customer from "../../models/Customer.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

/** Escape για ασφαλή χρήση του user input σε RegExp */
function escapeRegex(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ===============================
// GET /api/customers/search?q=...
// ===============================
export const searchCustomers = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();

    // ✅ ΠΑΝΤΑ ίδιο schema: { items: [] }
    if (!q) {
      return res.status(200).json({ items: [] });
    }

    const rx = new RegExp(escapeRegex(q), "i");

    const items = await Customer.find(
      { $or: [{ name: rx }, { phone: rx }, { email: rx }] },
      { name: 1, phone: 1, email: 1 } // projection
    )
      .sort({ name: 1 })
      .limit(20)
      .lean();

    logger.info(`customers.search: q="${q}", results=${items.length}`);
    return res.status(200).json({ items });
  } catch (err) {
    logger.error("customers.search error", { err: err.message, stack: err.stack });
    return next(new ApiError(500, "Σφάλμα κατά την αναζήτηση πελατών"));
  }
};
