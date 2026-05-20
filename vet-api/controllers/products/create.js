import * as svc from "../../services/products/productService.js";

export async function createOne(req, res, next) {
  try {
    const data = await svc.create(req.body);
    res.status(201).json(data);
  } catch (err) { next(err); }
}
