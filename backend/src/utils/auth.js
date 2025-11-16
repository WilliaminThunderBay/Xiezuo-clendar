const jwt = require('jsonwebtoken');
const config = require('../config');

function createToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role || 'user' },
    config.jwtSecret,
    { expiresIn: config.tokenExpiresIn }
  );
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

module.exports = {
  createToken,
  sanitizeUser
};

