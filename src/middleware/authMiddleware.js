const { status } = require('http-status');
const ApiError = require('../utils/apiError');
const { verifyAccessToken } = require('../utils/jwtToken');
const userService = require('../modules/user/services/userService');

/**
 * Extract token from various sources in request
 * @param {Object} req - Express request object
 * @returns {string|null} The extracted token or null if not found
 */
function extractToken(req) {
  return (
    req.cookies?.token ||
    req.headers['authorization']?.split(' ')[1] ||
    req.headers['x-access-token'] ||
    null
  );
}

/**
 * Authentication middleware.
 * Verifies the JWT token and attaches the user object to the request.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<Object>} - Passes control to the next middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const tokenRaw = extractToken(req);

    if (!tokenRaw) {
      return next(new ApiError(status.UNAUTHORIZED, 'Access denied. No token provided'));
    }

    const decoded = verifyAccessToken(tokenRaw);

    // Fetch user data only if the token is valid
    const user = await userService.getUser({ _id: decoded.id });

    if (!user) {
      return next(new ApiError(status.UNAUTHORIZED, 'User not found'));
    }

    // Check if the user account is active
    if (user.isActive === false) {
      return next(new ApiError(status.FORBIDDEN, 'Account is disabled'));
    }

    // Check if user is deleted (soft-delete)
    if (user.deleted) {
      return next(new ApiError(status.UNAUTHORIZED, 'User account has been removed'));
    }

    // Set user in request for Google OAuth users
    req.user = user;
    next();
  } catch (err) {
    // Provide more specific error messages based on error type
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(status.UNAUTHORIZED, 'Token has expired'));
    } else if (err.name === 'JsonWebTokenError') {
      return next(new ApiError(status.UNAUTHORIZED, 'Invalid token format'));
    }

    return next(
      new ApiError(status.UNAUTHORIZED, 'Authentication failed', [{ message: err.message }])
    );
  }
};

module.exports = authenticate;
