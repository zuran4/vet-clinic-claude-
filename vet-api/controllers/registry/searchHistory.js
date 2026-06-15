// vet-api/controllers/registry/searchHistory.js

import ApiError from "../../utils/apiError.js";
import RegistrySearchHistory from "../../models/RegistrySearchHistory.js";

/**
 * GET /api/registry/history
 * Επιστρέφει το κοινό ιστορικό αναζητήσεων μητρώου (όλες οι συσκευές).
 */
export async function getRegistryHistory(req, res) {
  const entries = await RegistrySearchHistory.getEntries();
  return res.json({ ok: true, history: entries });
}

/**
 * POST /api/registry/history
 * Body: { microchip, petName?, species? }
 * Προσθέτει/ανανεώνει εγγραφή στο κοινό ιστορικό αναζητήσεων.
 */
export async function addRegistryHistoryEntry(req, res) {
  const microchip = String(req.body?.microchip || "").trim();

  if (!microchip) {
    throw ApiError.badRequest("Missing required field: microchip", { field: "microchip" });
  }

  const entries = await RegistrySearchHistory.addEntry({
    microchip,
    petName: req.body?.petName,
    species: req.body?.species,
  });

  return res.json({ ok: true, history: entries });
}
