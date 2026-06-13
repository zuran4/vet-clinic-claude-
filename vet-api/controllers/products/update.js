import * as svc from "../../services/products/productService.js";
import { emitChange } from "../../utils/realtime.js";

export async function updateOne(req, res, next) {
  try {
    const data = await svc.update(req.params.id, req.body);
    emitChange("products");
    res.json(data);
  } catch (err) { next(err); }
}
