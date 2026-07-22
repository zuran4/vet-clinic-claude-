// validators/products/batchesSchema.js
import Joi from "joi";

// 24-hex ObjectId
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const addBatch = Joi.object({
  batchNumber: Joi.string().allow(""),
  quantity: Joi.number().integer().min(0).required(),
  purchaseDate: Joi.date().empty("").allow(null),
  expirationDate: Joi.date().empty("").allow(null),
  invoiceNumber: Joi.string().allow(""),
});

const patchBatch = Joi.object({
  batchNumber: Joi.string().allow(""),
  quantity: Joi.number().integer().min(0),
  purchaseDate: Joi.date().empty(""),
  expirationDate: Joi.date().empty(""),
  invoiceNumber: Joi.string().allow(""),
}).min(1); // τουλάχιστον ένα πεδίο για update

export default Joi.object({
  action: Joi.string().valid("add", "update", "remove").required(),

  // add
  batch: Joi.when("action", {
    is: "add",
    then: addBatch.required(),
    otherwise: Joi.forbidden(),
  }),

  // update/remove
  batchId: Joi.when("action", {
    is: Joi.valid("update", "remove"),
    then: objectId.required(),
    otherwise: Joi.forbidden(),
  }),

  // update
  patch: Joi.when("action", {
    is: "update",
    then: patchBatch.required(),
    otherwise: Joi.forbidden(),
  }),
});
