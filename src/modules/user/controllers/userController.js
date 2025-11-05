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
    // At this point, passport.authenticate has already been called in the route
    // and req.user should contain the authenticated user
    const user = req.user;

    if (!user) {
      console.error('Google OAuth failed - no user found in req.user');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?error=oauth_failed`);
    }

    // Validate user data before token generation
    if (!user._id || !user.email) {
      console.error('Google OAuth failed - incomplete user data:', { id: user._id, email: user.email });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?error=auth_failed`);
    }

    // Generate JWT token with error handling
    let token;
    try {
      token = generateAccessToken(user);
    } catch (tokenError) {
      console.error('JWT token generation failed:', tokenError);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?error=server_error`);
    }

    // Update last login with error handling
    try {
      await userService.updateLastLogin(user._id);
    } catch (updateError) {
      console.warn('Failed to update last login:', updateError);
      // Don't fail the authentication for this non-critical error
    }

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}`;
    
    console.log('OAuth success - redirecting to:', redirectUrl);
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
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
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      credits: user.credits,
      isActive: user.isActive,
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
    throw new ApiError(status.BAD_REQUEST, 'At least one field (name, email, or profilePicture) is required');
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
    id: updatedUser._id,
    email: updatedUser.email,
    name: updatedUser.name,
    avatar: updatedUser.avatar,
    credits: updatedUser.credits,
    isActive: updatedUser.isActive,
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
    id: user._id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    credits: user.credits,
    isActive: user.isActive,
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
  // Since we're using stateless JWT, logout is handled client-side
  // This endpoint can be used for logging purposes or token blacklisting if needed
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