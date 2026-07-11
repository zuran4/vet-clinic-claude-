import Joi from "joi";

export default Joi.object({
  name: Joi.string().trim().min(2).max(60).required().messages({
    "string.empty": "Το όνομα είναι υποχρεωτικό.",
    "string.min": "Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.",
    "any.required": "Το όνομα είναι υποχρεωτικό.",
  }),

  pin: Joi.string().trim().pattern(/^[0-9]{4,10}$/).required().messages({
    "string.empty": "Το PIN είναι υποχρεωτικό.",
    "string.pattern.base": "Το PIN πρέπει να έχει 4 έως 10 ψηφία.",
    "any.required": "Το PIN είναι υποχρεωτικό.",
  }),

  role: Joi.string().valid("admin", "vet", "secretary", "groomer", "assistant").required().messages({
    "any.only": "Μη έγκυρος ρόλος.",
    "any.required": "Ο ρόλος είναι υποχρεωτικός.",
  }),
});
