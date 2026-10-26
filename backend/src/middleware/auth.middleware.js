const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const authService = require('../services/auth.service');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token is missing.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (err) {
      const msg = err.name === 'TokenExpiredError' ? 'Token expired.' : 'Token invalid.';
      return res.status(401).json({
        success: false,
        message: `Not authorized: ${msg}`
      });
    }

    // Fetch user details to verify state
    const user = await authService.getProfile(decoded.id);

    if (user.status === 'inactive' || user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: `Not authorized: User status is ${user.status}.`
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: validation failed.'
    });
  }
};

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.'
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  protect,
  loginRateLimiter
};
