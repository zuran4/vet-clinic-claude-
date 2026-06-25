import Joi from "joi";

const loginSchema = Joi.object({
  clinicId: Joi.string().trim().lowercase().min(1).max(64).required(),
  pin:      Joi.string().trim().min(4).max(12).required(),
});

export default loginSchema;
