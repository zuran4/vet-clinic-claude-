import * as svc from "../../services/products/productService.js";

export async function updateOne(req, res, next) {
  try {
    const data = await svc.update(req.params.id, req.body);
    res.json(data);
  } catch (err) { next(err); }
}
