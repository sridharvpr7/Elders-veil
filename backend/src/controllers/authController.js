const AuthService = require('../services/authService');
const User = require('../models/User');

class AuthController {
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res) {
    // JWT client logout simulation
    res.status(200).json({ message: 'Logout successful.' });
  }

  static async getMe(req, res) {
    res.status(200).json({ user: req.user });
  }

  static async forgotPassword(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    // Password reset simulation
    res.status(200).json({ message: 'If an account exists with that email, a password reset link has been dispatched.' });
  }

  static async resetPassword(req, res) {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
    res.status(200).json({ message: 'Password reset successful. You may now log in.' });
  }
}

module.exports = AuthController;
