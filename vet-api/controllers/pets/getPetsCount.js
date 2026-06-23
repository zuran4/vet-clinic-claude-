export default async function getPetsCount(req, res, next) {
  try {
    const { Pet } = req.models;
    const total = await Pet.countDocuments();
    res.json({ total });
  } catch (err) {
    next(err);
  }
}
