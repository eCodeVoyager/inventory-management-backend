const ApiError = require('./apiError');

/**
 * Middleware to handle 404 errors for routes that are not found.
 * Creates a new instance of ApiError with a 404 status code and "Route Not Found" message.
 * Passes the error to the next middleware, typically the error handler.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next function.
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, 'Route Not Found');
  next(error);
};

/**
 * Middleware to handle errors.
 * Handles Mongoose validation, duplicate key, and cast errors specifically.
 * If an ApiError is caught, it sends a structured response to the client.
 * Otherwise, it logs the error and returns a generic 500 Internal Server Error.
 *
 * @param {Object} err - The error object.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} _next - Express next function.
 */
const errorHandler = (err, req, res, _next) => {
  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.type === 'entity.parse.failed' && err.status === 400) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload',
      timestamp: new Date().toISOString(),
      error: {
        code: 'INVALID_JSON',
        details: err.message
      }
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    err = new ApiError(400, 'Validation Error', messages);
  }

  // Handle Mongoose duplicate key errors
  if (err.code && err.code === 11000) {
    const message = 'Duplicate field value entered';
    err = new ApiError(400, message);
  }

  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value || req.params.id || 'unknown'}`;
    err = new ApiError(404, message);
  }

  // If the error is an instance of ApiError, send the structured response
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      timestamp: new Date().toISOString(),
      error: {
        code: err.code || 'ERROR',
        details: err.errors || err.message
      }
    });
  }

  // Log unexpected errors and respond with a generic 500 error
  console.error(err);

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    timestamp: new Date().toISOString(),
    error: {
      code: 'INTERNAL_ERROR',
      details: 'An unexpected error occurred'
    }
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
