// ===============================================
// 📄 controllers/customers/getAllCustomers.js
// Περιγραφή: Λίστα πελατών με dual-mode:
// 1) Search: GET /api/customers?search=gi  -> [] (λίστα απλή)
// 2) Pagination: GET /api/customers?page=1&pageSize=9 -> { data, total, ... }
// ===============================================

import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";
import { normalizeGreek } from "../../utils/greekNormalize.js";
import { computeShowNewBadge } from "../../utils/customerBadge.js";

export const getAllCustomers = async (req, res, next) => {
  try {
    const { Customer, Pet, Appointment } = req.models;
    const raw = (req.query.search ?? req.query.q ?? "").trim();
    if (raw.length >= 2) {
      const safe = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safe, "i"); // για το τηλέφωνο (δεν χρειάζεται normalization)

      const normQuery = normalizeGreek(raw).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const nameRegex = new RegExp(normQuery, "i"); // ανεκτικό σε τόνους/ομόηχα

      // Ψάχνουμε πελάτες (όνομα/τηλέφωνο) ΚΑΙ κατοικίδια (όνομα) — έτσι το
      // προσωπικό μπορεί να βρει τον ιδιοκτήτη γράφοντας το όνομα του ζώου.
      // Η αναζήτηση ονόματος γίνεται πάνω στο nameNormalized (χωρίς τόνους,
      // με ομόηχα ενοποιημένα) ώστε "περλα"/"παιρλα" να βρίσκουν "Πέρλα".
      const [customerMatches, petMatches] = await Promise.all([
        Customer.find(
          { $or: [{ nameNormalized: nameRegex }, { phone: regex }] },
          { name: 1, phone: 1 } // μόνο ό,τι χρειάζεται για dropdown
        ).limit(20).lean(),
        Pet.find({ nameNormalized: nameRegex }, { name: 1, owner: 1 }).limit(20).lean(),
      ]);

      const byId = new Map(customerMatches.map((c) => [String(c._id), c]));

      const petOwnerIds = [...new Set(petMatches.map((p) => String(p.owner || "")).filter(Boolean))]
        .filter((id) => !byId.has(id));

      const petOwners = petOwnerIds.length
        ? await Customer.find({ _id: { $in: petOwnerIds } }, { name: 1, phone: 1 }).lean()
        : [];
      for (const c of petOwners) byId.set(String(c._id), c);

      // Ποιο/ποια κατοικίδια ταίριαξαν, ανά ιδιοκτήτη — για να ξεχωρίζει το UI
      // ίδια ονόματα κατοικιδίων διαφορετικών ιδιοκτητών (π.χ. δύο σκύλοι "Rex").
      for (const pet of petMatches) {
        const oid = String(pet.owner || "");
        const owner = byId.get(oid);
        if (!owner) continue;
        owner.matchedPets = owner.matchedPets ? [...owner.matchedPets, pet.name] : [pet.name];
      }

      const results = [...byId.values()].slice(0, 20);

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
        { name: 1, phone: 1, email: 1, address: 1, city: 1, afm: 1, notes: 1, notifications: 1, createdAt: 1, isNewCustomer: 1 }
      )
        // .sort({ createdAt: -1 }) // αν το schema έχει timestamps
        .sort({ _id: -1 }) // ασφαλής ταξινόμηση χωρίς timestamps
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    // "Νέος" badge: μόνο για πελάτες με isNewCustomer=true ΚΑΙ λιγότερα από
    // NEW_CUSTOMER_APPOINTMENT_LIMIT ραντεβού συνολικά — φεύγει αυτόματα
    // μόλις φτάσουν το όριο.
    const newCandidateIds = customers.filter((c) => c.isNewCustomer).map((c) => c._id);
    const countsById = new Map();
    if (newCandidateIds.length) {
      const counts = await Appointment.aggregate([
        { $match: { owner: { $in: newCandidateIds } } },
        { $group: { _id: "$owner", count: { $sum: 1 } } },
      ]);
      for (const row of counts) countsById.set(String(row._id), row.count);
    }
    for (const c of customers) {
      c.showNewBadge = computeShowNewBadge(c.isNewCustomer, countsById.get(String(c._id)));
    }

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
