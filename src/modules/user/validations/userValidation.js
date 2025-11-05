const Joi = require('joi');

// Validation schema for updating user profile
const updateUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters',
      'string.pattern.base': 'Name can only contain letters and spaces'
    }),
  
  profilePicture: Joi.string()
    .uri()
    .messages({
      'string.uri': 'Profile picture must be a valid URL'
    }),
  
  isActive: Joi.boolean()
});

// Validation schema for Google OAuth callback data
const googleAuthSchema = Joi.object({
  googleId: Joi.string()
    .required()
    .messages({
      'any.required': 'Google ID is required',
      'string.empty': 'Google ID cannot be empty'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'any.required': 'Email is required',
      'string.email': 'Please provide a valid email address'
    }),
  
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .trim()
    .messages({
      'any.required': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters'
    }),
  
  profilePicture: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'Profile picture must be a valid URL'
    })
});

// Validation schema for JWT token verification
const tokenSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Token is required',
      'string.empty': 'Token cannot be empty'
    })
});

// Validation middleware function
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

// Validation middleware for query parameters
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors
      });
    }

    next();
  };
};

module.exports = {
  updateUserSchema,
  googleAuthSchema,
  tokenSchema,
  validateRequest,
  validateQuery
};