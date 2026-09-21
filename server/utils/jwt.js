const jwt = require('jsonwebtoken');
const env = require('../config/env');

function generateToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken
};
