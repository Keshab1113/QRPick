const Joi = require("joi");

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    next();
  };
};

const schemas = {
  adminLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  userRegister: Joi.object({
    name: Joi.string().min(2).max(255).required().messages({
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 255 characters",
      "string.empty": "Name is required",
      "any.required": "Name is required",
    }),

    koc_id: Joi.string().min(3).max(100).required().messages({
      "string.min": "KOC ID must be at least 3 characters long",
      "string.max": "KOC ID cannot exceed 100 characters",
      "string.empty": "KOC ID is required",
      "any.required": "KOC ID is required",
    }),

    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .pattern(/@kockw\.com$/)
      .messages({
        "string.email": "Please enter a valid email address",
        "string.empty": "Email is required",
        "any.required": "Email is required",
        "string.pattern.base": "Only @kockw.com email addresses are allowed",
      }),

    session_token: Joi.string().required().messages({
      "string.empty": "Session token is required",
      "any.required": "Session token is required",
    }),
  }),
};

module.exports = { validateRequest, schemas };