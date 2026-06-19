import Pet from "../../models/Pet.js";

export default async function getPetsCount(req, res, next) {
  try {
    const total = await Pet.countDocuments();
    res.json({ total });
  } catch (err) {
    next(err);
  }
}
