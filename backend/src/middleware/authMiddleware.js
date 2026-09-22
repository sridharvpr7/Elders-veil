const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Missing token.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }
    if (user.account_status === 'banned') return res.status(403).json({ error: 'This account has been banned.' });
    if (user.account_status === 'blocked') return res.status(403).json({ error: 'This account is currently blocked.' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed.' });
  }
}

// Optional Auth (doesn't fail if no token, but sets req.user if valid token provided)
async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        req.user = await User.findById(decoded.userId);
      }
    }
  } catch (err) {
    // Ignore optional auth error
  }
  next();
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
