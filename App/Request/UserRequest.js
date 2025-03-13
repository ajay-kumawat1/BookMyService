import Joi from "joi";
import { Role } from "../Common/common.js";

export const validateUser = (data) => {
  const schema = Joi.object({
    firstName: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        "string.base": "First name must be a string.",
        "string.empty": "First name is required.",
        "string.min": "First name must have at least 2 characters.",
        "string.max": "First name must have at most 50 characters."
      }),

    lastName: Joi.string().max(50).allow(null, ""),

    email: Joi.string()
      .email()
      .required()
      .messages({
        "string.email": "Please provide a valid email address.",
        "string.empty": "Email is required."
      }),

    password: Joi.string()
      .min(6)
      .max(1024)
      .required()
      .messages({
        "string.min": "Password must be at least 6 characters long.",
        "string.max": "Password cannot exceed 1024 characters.",
        "string.empty": "Password is required."
      }),

    phoneNumber: Joi.string()
      .pattern(/^\d{10}$/)
      .required()
      .messages({
        "string.pattern.base": "Phone number must be a 10-digit number.",
        "string.empty": "Phone number is required."
      }),

    avatar: Joi.string().uri().allow(null, ""),

    role: Joi.string()
      .valid(Role.USER, Role.ADMIN)
      .default(Role.USER)
      .messages({
        "any.only": "Role must be either USER or ADMIN."
      }),

    isVerified: Joi.boolean().default(false),
  });

  return schema.validate(data);
};
