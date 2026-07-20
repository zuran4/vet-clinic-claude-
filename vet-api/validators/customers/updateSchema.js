import Joi from "joi";

export default Joi.object({
  name: Joi.string().trim().min(2).max(100).optional().messages({
    "string.min": "Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.",
  }),

  phone: Joi.string().trim().min(10).max(15).optional().messages({
    "string.min": "Το τηλέφωνο πρέπει να έχει τουλάχιστον 10 ψηφία.",
  }),

  email: Joi.string().trim().email().allow("").optional().messages({
    "string.email": "Το email δεν είναι έγκυρο.",
  }),

  address: Joi.string().trim().max(200).allow("").optional(),

  notes: Joi.string().trim().max(500).allow("").optional(),

  alert: Joi.string().trim().max(500).allow("").optional(),

  notifications: Joi.object({
    email: Joi.boolean(),
    sms: Joi.boolean(),
    reminders: Joi.boolean(),
    promotions: Joi.boolean(),
  }).optional(),
});
