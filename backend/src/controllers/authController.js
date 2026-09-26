const AuthService = require('../services/authService');

class AuthController {
  static async register(req, res, next) { try { res.status(201).json(await AuthService.register(req.body)); } catch (err) { next(err); } }
  static async verifyEmailOTP(req, res, next) { try { res.status(200).json(await AuthService.verifyEmailOTP(req.body)); } catch (err) { next(err); } }
  static async resendEmailOTP(req, res, next) { try { res.status(200).json(await AuthService.resendEmailOTP(req.body)); } catch (err) { next(err); } }
  static async login(req, res, next) { try { res.status(200).json(await AuthService.login(req.body)); } catch (err) { next(err); } }
  static async logout(req, res) { res.status(200).json({ message: 'Logout successful.' }); }
  static async getMe(req, res) { res.status(200).json({ user: req.user }); }
  static async forgotPassword(req, res, next) { try { res.status(200).json(await AuthService.requestPasswordReset(req.body)); } catch (err) { next(err); } }
  static async verifyResetOTP(req, res, next) { try { res.status(200).json(await AuthService.verifyResetOTP(req.body)); } catch (err) { next(err); } }
  static async resetPassword(req, res, next) { try { res.status(200).json(await AuthService.resetPassword(req.body)); } catch (err) { next(err); } }
}
module.exports = AuthController;
