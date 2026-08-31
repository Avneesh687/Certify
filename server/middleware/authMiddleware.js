const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'certify_super_secret_key_2026';

/**
 * Middleware to verify JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : req.query.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    if (user.status === 'deactivated') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact Admin.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
};

/**
 * Middleware to check for Admin role
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Admin privileges required for this action.' });
  }
};

/**
 * Middleware for Developer API Key access
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;

    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'API key required. Include X-API-KEY header.' });
    }

    const user = await User.findOne({ 'apiKeys.key': apiKey }).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid API key provided.' });
    }

    if (user.status === 'deactivated') {
      return res.status(403).json({ success: false, message: 'Account deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'API key authentication failed.' });
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
  authenticateApiKey,
  JWT_SECRET
};
