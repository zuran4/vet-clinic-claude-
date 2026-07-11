import Joi from "joi";

export default Joi.object({
  name: Joi.string().trim().min(2).max(60).messages({
    "string.min": "Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.",
  }),

  pin: Joi.string().trim().pattern(/^[0-9]{4,10}$/).allow("").messages({
    "string.pattern.base": "Το PIN πρέπει να έχει 4 έως 10 ψηφία.",
  }),

  role: Joi.string().valid("admin", "vet", "secretary", "groomer", "assistant").messages({
    "any.only": "Μη έγκυρος ρόλος.",
  }),

  isActive: Joi.boolean(),
}).min(1);
