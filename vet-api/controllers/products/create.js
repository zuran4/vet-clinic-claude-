import * as svc from "../../services/products/productService.js";
import { emitChange } from "../../utils/realtime.js";

export async function createOne(req, res, next) {
  try {
    const data = await svc.create(req.body, req.models);
    emitChange("products");
    res.status(201).json(data);
  } catch (err) { next(err); }
}
