const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'fallback_access_secret_123';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret_456';

/**
 * Generate short-lived JWT Access Token (15 minutes)
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, email: user.email },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
};

/**
 * Generate long-lived JWT Refresh Token (7 days)
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, email: user.email },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Verify JWT Access Token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
};

/**
 * Verify JWT Refresh Token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
