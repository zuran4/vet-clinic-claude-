// controllers/products/updateBatches.js
import Product from "../../models/Product.js";

// Ασφαλής μετατροπή σε αριθμό
function toNum(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

/**
 * PUT /api/products/:id/batches
 *
 * Body (validate με validators/products/batchesSchema.js):
 *  { "action": "add",    "batch": { batchNumber, quantity, purchaseDate, expirationDate, invoiceNumber } }
 *  { "action": "update", "batchId": "<id>", "patch": { batchNumber?, quantity?, purchaseDate?, expirationDate?, invoiceNumber? } }
 *  { "action": "remove", "batchId": "<id>" }
 *
 * Επιστρέφει:
 *  { productId, quantity, batches[] }
 *
 * Σημείωση:
 *  Το μοντέλο Product έχει post('findOneAndUpdate') hook που συγχρονίζει το quantity από τα batches.
 *  Με { new:true } παίρνουμε πίσω το ενημερωμένο doc.
 */
export async function updateBatches(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!action) return res.status(400).json({ message: "Missing action" });

    let doc;

    // ADD
    if (action === "add") {
      const b = req.body.batch || {};
      const batch = {
        batchNumber: b.batchNumber ?? "",
        quantity: toNum(b.quantity),
        purchaseDate: b.purchaseDate ?? null,
        expirationDate: b.expirationDate ?? null,
        invoiceNumber: b.invoiceNumber ?? "",
      };

      doc = await Product.findByIdAndUpdate(
        id,
        { $push: { batches: batch } },
        { new: true, runValidators: true }
      );
    }

    // UPDATE
    else if (action === "update") {
      const { batchId, patch = {} } = req.body;
      if (!batchId) return res.status(400).json({ message: "Missing batchId" });

      const set = {};
      if (patch.batchNumber != null)   set["batches.$[b].batchNumber"] = patch.batchNumber;
      if (patch.quantity != null)      set["batches.$[b].quantity"] = toNum(patch.quantity);
      if (patch.purchaseDate != null)  set["batches.$[b].purchaseDate"] = patch.purchaseDate;
      if (patch.expirationDate != null)set["batches.$[b].expirationDate"] = patch.expirationDate;
      if (patch.invoiceNumber != null) set["batches.$[b].invoiceNumber"] = patch.invoiceNumber;

      doc = await Product.findByIdAndUpdate(
        id,
        { $set: set },
        {
          new: true,
          runValidators: true,
          arrayFilters: [{ "b._id": batchId }],
        }
      );
    }

    // REMOVE
    else if (action === "remove") {
      const { batchId } = req.body;
      if (!batchId) return res.status(400).json({ message: "Missing batchId" });

      doc = await Product.findByIdAndUpdate(
        id,
        { $pull: { batches: { _id: batchId } } },
        { new: true, runValidators: true }
      );
    }

    // Unsupported
    else {
      return res.status(400).json({ message: `Unsupported action: ${action}` });
    }

    if (!doc) return res.status(404).json({ message: "Product not found" });

    // Επιστρέφουμε το ενημερωμένο προϊόν (quantity συγχρονισμένο από το schema hook)
    return res.json({
      productId: doc._id,
      quantity: doc.quantity,
      batches: doc.batches ?? [],
    });
  } catch (err) {
    next(err);
  }
}
