import * as svc from "../../services/products/productService.js";

export async function exportStock(req, res, next) {
  try {
    const product = await svc.exportStock(req.body, req.models);
    res.json({ message: "✅ Εξαγωγή ολοκληρώθηκε", product });
  } catch (err) { next(err); }
}
