import Joi from "joi";

const loginSchema = Joi.object({
  pin: Joi.string().trim().min(4).max(12).required(), // ρύθμισε range όπως θες
});

export default loginSchema;
