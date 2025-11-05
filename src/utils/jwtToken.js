const jwt = require('jsonwebtoken');

const generateAccessToken = user => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role || 'user',
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
  };
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_LIFE || '1h',
    audience: 'inventory-api',
    issuer: 'inventory-system',
  });
};

const verifyAccessToken = token => {
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
    audience: 'inventory-api',
    issuer: 'inventory-system',
  });

  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }

  return decoded;
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
};
