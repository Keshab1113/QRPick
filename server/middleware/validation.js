const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
};

const schemas = {
  adminLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  userRegister: Joi.object({
    name: Joi.string()
      .min(2)
      .max(255)
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 255 characters',
        'string.empty': 'Name is required',
        'any.required': 'Name is required'
      }),

    koc_id: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.min': 'KOC ID must be at least 3 characters long',
        'string.max': 'KOC ID cannot exceed 100 characters',
        'string.empty': 'KOC ID is required',
        'any.required': 'KOC ID is required'
      }),

    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .pattern(/@kockw\.com$/)
      .messages({
        'string.email': 'Please enter a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required',
        'string.pattern.base': 'Only @kockw.com email addresses are allowed'
      }),

    team: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Team selection is required',
        'string.empty': 'Please select a team',
        'any.required': 'Team selection is required'
      }),

    mobile: Joi.string()
      .pattern(/^[0-9]{8,12}$/)
      .required()
      .messages({
        'string.pattern.base': 'Mobile number must contain only digits and be between 8 to 12 digits',
        'string.empty': 'Mobile number is required',
        'any.required': 'Mobile number is required'
      }),

    session_token: Joi.string()
      .required()
      .messages({
        'string.empty': 'Session token is required',
        'any.required': 'Session token is required'
      }),

    otherTeam: Joi.string()
      .allow('')
      .optional()
      .when('team', {
        is: 'Others',
        then: Joi.string().min(2).max(100).required().messages({
          'string.empty': 'Please enter your team name',
          'string.min': 'Team name must be at least 2 characters long',
          'any.required': 'Team name is required when selecting Others'
        }),
        otherwise: Joi.string().allow('').optional()
      })
  })
};

module.exports = { validateRequest, schemas };
