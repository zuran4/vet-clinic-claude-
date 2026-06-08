// ===============================================
// 📄 controllers/customers/getAllCustomers.js
// Περιγραφή: Λίστα πελατών με dual-mode:
// 1) Search: GET /api/customers?search=gi  -> [] (λίστα απλή)
// 2) Pagination: GET /api/customers?page=1&pageSize=9 -> { data, total, ... }
// ===============================================

import Customer from "../../models/Customer.js"; // ✅ ενοποιημένο μονοπάτι
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

export const getAllCustomers = async (req, res, next) => {
  try {
    // --------------------------
    // 1) SEARCH MODE
    // --------------------------
    const raw = (req.query.search ?? req.query.q ?? "").trim();
    if (raw.length >= 2) {
      const safe = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safe, "i");

      const results = await Customer.find(
        { $or: [{ name: regex }, { phone: regex }] },
        { name: 1, phone: 1 } // μόνο ό,τι χρειάζεται για dropdown
      )
        .limit(20)
        .lean();

      logger.info(`🔍 Customers search "${raw}" → ${results.length} αποτελέσματα`);
      return res.json(results); // 🔸 λίστα, όχι αντικείμενο
    }

    // --------------------------
    // 2) PAGINATION MODE
    // --------------------------
    const page = Number.parseInt(req.query.page, 10) || 1;
    const pageSizeRaw = Number.parseInt(req.query.pageSize, 10) || 9;
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 50); // 1..50
    const skip = (page - 1) * pageSize;

    const [total, customers] = await Promise.all([
      Customer.countDocuments({}),
      Customer.find(
        {},
        { name: 1, phone: 1, email: 1, address: 1, city: 1, afm: 1, notes: 1, notifications: 1, createdAt: 1 }
      )
        // .sort({ createdAt: -1 }) // αν το schema έχει timestamps
        .sort({ _id: -1 }) // ασφαλής ταξινόμηση χωρίς timestamps
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    logger.info(`👥 Επιστράφηκαν ${customers.length} πελάτες (σελίδα ${page})`);

    return res.json({
      data: customers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη λήψη πελατών", { stack: err.stack });
    return next(new ApiError(500, "Σφάλμα κατά τη λήψη πελατών"));
  }
};
