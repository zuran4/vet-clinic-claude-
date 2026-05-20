import Joi from "joi";

export default Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Το όνομα είναι υποχρεωτικό.",
    "string.min": "Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.",
    "any.required": "Το όνομα είναι υποχρεωτικό.",
  }),

  phone: Joi.string().trim().min(10).max(15).required().messages({
    "string.empty": "Το τηλέφωνο είναι υποχρεωτικό.",
    "string.min": "Το τηλέφωνο πρέπει να έχει τουλάχιστον 10 ψηφία.",
    "any.required": "Το τηλέφωνο είναι υποχρεωτικό.",
  }),

  email: Joi.string().trim().email().allow("").optional().messages({
    "string.email": "Το email δεν είναι έγκυρο.",
  }),

  address: Joi.string().trim().max(200).allow("").optional(),

  notes: Joi.string().trim().max(500).allow("").optional(),

  notifications: Joi.object({
    email: Joi.boolean().default(true),
    sms: Joi.boolean().default(false),
    reminders: Joi.boolean().default(true),
    promotions: Joi.boolean().default(false),
  }).optional(),
});
