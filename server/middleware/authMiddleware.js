const { verifyAccessToken } = require('../utils/tokenUtils');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Missing or malformed Authorization header.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access Token expired.',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Invalid Access Token.',
      code: 'INVALID_TOKEN',
    });
  }
};

module.exports = verifyToken;
