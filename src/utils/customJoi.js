// utils/customJoi.js
const Joi = require('joi');

// Custom validator for MongoDB ObjectId
const objectId = Joi.string()
  .trim()
  .length(24)
  .hex()
  .regex(/^[a-fA-F0-9]{24}$/)
  .message('Invalid MongoDB ObjectId');

// Custom validator for YYYY-MM-DD date format
const dateFormat = Joi.extend(joi => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'string.dateFormat': '{{#label}} must be a valid date in YYYY-MM-DD format',
  },
  rules: {
    format: {
      validate(value, helpers) {
        // Check if the string matches YYYY-MM-DD format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return helpers.error('string.dateFormat');
        }

        // Validate that it's a valid date
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return helpers.error('string.dateFormat');
        }

        return value;
      },
    },
  },
}));

module.exports = {
  objectId,
  dateFormat,
};
