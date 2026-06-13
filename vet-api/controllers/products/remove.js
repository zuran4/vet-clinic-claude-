import * as svc from "../../services/products/productService.js";
import { emitChange } from "../../utils/realtime.js";

export async function removeOne(req, res, next) {
  try {
    await svc.remove(req.params.id);
    emitChange("products");
    res.json({ message: "✅ Το προϊόν διαγράφηκε επιτυχώς" });
  } catch (err) { next(err); }
}
