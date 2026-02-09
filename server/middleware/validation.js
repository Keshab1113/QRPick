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
    name: Joi.string().min(2).max(255).required(),
    koc_id: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    team: Joi.string().min(2).max(100).required(),
    mobile: Joi.string().pattern(/^[0-9+\s()-]{10,20}$/).required(),
    session_token: Joi.string().required()
  })
};

module.exports = { validateRequest, schemas };
