export async function me(req, res) {
  // req.user έρχεται από requireAuth
  res.json(req.user);
}
