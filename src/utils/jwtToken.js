//src/utils/jwtToken.js

const jwt = require('jsonwebtoken');

/**
 * Generate an access token with security best practices
 * @param {Object} user - User object containing authentication info
 * @returns {string} JWT access token
 */
const generateAccessToken = user => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role?.name || user.role || 'user', // Safe access with fallback
    messId: user.messId ? user.messId : null,
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
  };
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_LIFE || '1h',
    audience: 'leelu-ai-api',
    issuer: 'leelu-ai-system',
  });
};

/**
 * Generate a refresh token with security best practices
 * @param {Object} user - User object containing authentication info
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = user => {
  const payload = {
    id: user.id,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
  };
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_LIFE || '7d',
    audience: 'leelu-ai-api',
    issuer: 'leelu-ai-system',
  });
};

/**
 * Generate an invite token
 * @param {Object} user - User invite information
 * @returns {string} JWT invite token
 */
const genInviteToken = user => {
  const payload = {
    inviterId: user.id,
    organizationId: user.organizationId ? user.organizationId : null,
    email: user.email,
    roleId: user.roleId,
    type: 'invite',
    iat: Math.floor(Date.now() / 1000),
  };
  return jwt.sign(payload, process.env.INVITE_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.INVITE_TOKEN_LIFE || '3d',
    audience: 'leelu-ai-api',
    issuer: 'leelu-ai-system',
  });
};

/**
 * Verify an access token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid
 */
const verifyAccessToken = token => {
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
    audience: 'leelu-ai-api',
    issuer: 'leelu-ai-system',
  });

  // Check token type for enhanced security
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }

  return decoded;
};

/**
 * Verify a refresh token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid
 */
const verifyRefreshToken = token => {
  const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, {
    audience: 'leelu-ai-api',
    issuer: 'leelu-ai-system',
  });

  // Check token type for enhanced security
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  return decoded;
};

/**
 * Verify an invite token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid
 */
const verifyInviteToken = token => {
  return jwt.verify(token, process.env.INVITE_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET, {
    audience: 'leelu-ai-api',
    issuer: 'leelu-ai-system',
  });
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object containing both tokens
 */
const genTokens = user => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  return { accessToken, refreshToken };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  genTokens,
  genInviteToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyInviteToken,
};
