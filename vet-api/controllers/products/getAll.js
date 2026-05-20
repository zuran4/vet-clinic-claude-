import * as svc from "../../services/products/productService.js";

export async function getAll(req, res, next) {
  try {
    const search = req.query.search?.trim() || "";
    const data = await svc.listAll(search);
    res.json(data);
  } catch (err) { next(err); }
}
