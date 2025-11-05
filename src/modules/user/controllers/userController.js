const passport = require('passport');
const userService = require('../services/userService');
const { generateAccessToken, verifyAccessToken } = require('../../../utils/jwtToken');
const ApiResponse = require('../../../utils/apiResponse');
const ApiError = require('../../../utils/apiError');
const catchAsync = require('../../../utils/catchAsync');
const { status } = require('http-status');

/**
 * Initiate Google OAuth authentication
 */
const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

/**
 * Handle Google OAuth callback
 */
const googleCallback = catchAsync(async (req, res, _next) => {
  try {
    const user = req.user;

    if (!user) {
      console.error('Google OAuth failed - no user found in req.user');
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?error=oauth_failed`
      );
    }

    if (!user.id || !user.email) {
      console.error('Google OAuth failed - incomplete user data:', {
        id: user.id,
        email: user.email,
      });
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?error=auth_failed`
      );
    }

    let token;
    try {
      token = generateAccessToken(user);
    } catch (tokenError) {
      console.error('JWT token generation failed:', tokenError);
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?error=server_error`
      );
    }

    try {
      await userService.updateLastLogin(user.id);
    } catch (updateError) {
      console.warn('Failed to update last login:', updateError);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}`;

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth?error=server_error`);
  }
});

/**
 * Verify JWT token and return user data
 */
const verifyToken = catchAsync(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new ApiError(status.UNAUTHORIZED, 'No token provided');
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await userService.getUserById(decoded.id);

    if (!user) {
      throw new ApiError(status.UNAUTHORIZED, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(status.FORBIDDEN, 'Account is disabled');
    }

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      lastLogin: user.lastLogin,
    };

    res.json(new ApiResponse(status.OK, userData, 'Token verified successfully'));
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new ApiError(status.UNAUTHORIZED, 'Invalid or expired token');
    }
    throw error;
  }
});

/**
 * Update user profile
 */
const updateUser = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { name, email, profilePicture } = req.body;

  // Validate input
  if (!name && !email && !profilePicture) {
    throw new ApiError(
      status.BAD_REQUEST,
      'At least one field (name, email, or profilePicture) is required'
    );
  }

  // Only allow safe fields to be updated
  const updateData = {};
  if (name) updateData.name = name.trim();
  if (email) updateData.email = email.toLowerCase().trim();
  if (profilePicture) updateData.profilePicture = profilePicture;

  const updatedUser = await userService.updateUserById(userId, updateData);

  if (!updatedUser) {
    throw new ApiError(status.NOT_FOUND, 'User not found');
  }

  const userData = {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    avatar: updatedUser.avatar,
    role: updatedUser.role,
    isActive: updatedUser.isActive,
    isBlocked: updatedUser.isBlocked,
    lastLogin: updatedUser.lastLogin,
  };

  res.json(new ApiResponse(status.OK, userData, 'User updated successfully'));
});

/**
 * Get current user profile
 */
const getCurrentUser = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user = await userService.getUserById(userId);

  if (!user) {
    throw new ApiError(status.NOT_FOUND, 'User not found');
  }

  const userData = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    isActive: user.isActive,
    isBlocked: user.isBlocked,
    lastLogin: user.lastLogin,
    authProvider: user.authProvider,
    isEmailVerified: user.isEmailVerified,
  };

  res.json(new ApiResponse(status.OK, userData, 'User profile retrieved successfully'));
});

/**
 * Logout user (client-side token removal)
 */
const logout = catchAsync(async (req, res) => {
  res.json(new ApiResponse(status.OK, null, 'Logged out successfully'));
});

module.exports = {
  googleAuth,
  googleCallback,
  verifyToken,
  updateUser,
  getCurrentUser,
  logout,
};
