import * as svc from "../../services/products/productService.js";

export async function getBatches(req, res, next) {
  try {
    const batches = await svc.getBatches(req.params.id);
    res.json(batches);
  } catch (err) { next(err); }
}
