import mongoose from "mongoose";

import ApiError from "./apiError.js";

function validateObjectId(req, _res, next) {
  const id =
    req.params.id ||
    req.params.customerId ||
    req.params.petId ||
    req.params.purchaseId;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(ApiError.badRequest("Μη έγκυρο ID"));
  }

  next();
}

export default validateObjectId;
