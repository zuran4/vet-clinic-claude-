import Joi from "joi";

export default Joi.object({
  name: Joi.string().trim().min(2).required(),
  sku: Joi.string().trim().allow(""),
  category: Joi.string().valid("Φάρμακο","Τροφή","Αξεσουάρ","Παιχνίδι","Άλλο").required(),
  price: Joi.number().min(0).default(0),
  taxRate: Joi.number().min(0).max(1).default(0.24),
  trackStock: Joi.boolean().default(true),
  quantity: Joi.number().integer().min(0).default(0),
  batches: Joi.array().items(
    Joi.object({
      lot: Joi.string().allow(""),
      qty: Joi.number().integer().min(0).required(),
      expiry: Joi.date().optional(),
    })
  ).default([]),
});
