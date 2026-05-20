import Joi from "joi";

export default Joi.object({
  name: Joi.string().trim().min(2),
  sku: Joi.string().trim(),
  category: Joi.string().valid("Φάρμακο","Τροφή","Αξεσουάρ","Παιχνίδι","Άλλο"),
  price: Joi.number().min(0),
  taxRate: Joi.number().min(0).max(1),
  trackStock: Joi.boolean(),
  quantity: Joi.number().integer().min(0),
  batches: Joi.array().items(
    Joi.object({
      lot: Joi.string().allow(""),
      qty: Joi.number().integer().min(0).required(),
      expiry: Joi.date().optional(),
    })
  ),
}).min(1);
