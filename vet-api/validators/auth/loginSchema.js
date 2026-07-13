import Joi from "joi";

const loginSchema = Joi.object({
  clinicId: Joi.string().trim().lowercase().min(1).max(64).required(),
  userId:   Joi.string().trim().pattern(/^[a-fA-F0-9]{24}$/).required().messages({
    "string.pattern.base": "Μη έγκυρο userId.",
  }),
  pin:      Joi.string().trim().min(4).max(12).required(),
});

export default loginSchema;
