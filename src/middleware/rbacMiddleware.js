//  Middleware to enforce role-based access control (RBAC).

const roles = require("../config/roles");
const httpStatus = require("http-status");
const ApiError = require("../utils/apiError");

/**
 * Middleware to enforce role-based access control (RBAC).
 *
 * @param {Array} allowedPermissions - List of permissions required for access.
 * @returns {Function} - Middleware function that checks user permissions.
 */
const authorize = (allowedPermissions) => {
  return (req, _, next) => {
    try {
      const userRole = req.user.role;
      const userPermissions = roles[userRole]?.can || [];

      const hasPermission = allowedPermissions.some((permission) =>
        userPermissions.includes(permission)
      );

      if (hasPermission) {
        return next();
      }

      return next(
        new ApiError(
          httpStatus.FORBIDDEN,
          "You do not have permission to access this route"
        )
      );
    } catch (error) {
      next(error);
    }
  };
};

module.exports = authorize;
