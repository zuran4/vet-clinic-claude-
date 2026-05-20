import mongoose from "mongoose";

// ✅ Middleware έλεγχος για ObjectId
function validateObjectId(req, res, next) {
  const id =
    req.params.id ||
    req.params.customerId ||
    req.params.petId ||
    req.params.purchaseId;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "❌ Μη έγκυρο ID" });
  }

  next(); // προχωράει στο επόμενο middleware ή route handler
}

export default validateObjectId;
