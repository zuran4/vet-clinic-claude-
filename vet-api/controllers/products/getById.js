import * as svc from "../../services/products/productService.js";

export async function getById(req, res, next) {
  try {
    const data = await svc.getById(req.params.id);
    res.json(data);
  } catch (err) { next(err); }
}
