import * as svc from "../../services/products/productService.js";

export async function removeOne(req, res, next) {
  try {
    await svc.remove(req.params.id);
    res.json({ message: "✅ Το προϊόν διαγράφηκε επιτυχώς" });
  } catch (err) { next(err); }
}
