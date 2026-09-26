const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { isValidEmail, isValidUsername, isValidPassword } = require('../utils/validation');
const NotificationService = require('./notificationService');
const EmailService = require('./emailService');

class AuthService {
  static generateSecureOTP() {
    return crypto.randomInt(100000, 1000000).toString();
  }

  static async register({ username, email, phone, mobile_number, password, confirmPassword }) {
    const mobile = mobile_number || phone;
    if (!username || !email || !mobile || !password || !confirmPassword) {
      throw { statusCode: 400, message: 'Username, email, mobile number, password, and confirm password are required.' };
    }
    if (password !== confirmPassword) throw { statusCode: 400, message: 'Passwords do not match.' };
    if (!isValidUsername(username)) throw { statusCode: 400, message: 'Username must be between 3 and 30 characters.' };
    if (!isValidEmail(email)) throw { statusCode: 400, message: 'Invalid email address format.' };
    if (!isValidPassword(password)) throw { statusCode: 400, message: 'Password must be at least 6 characters long.' };
    if (!User.validateIndianMobile(mobile)) throw { statusCode: 400, message: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).' };

    email = email.trim().toLowerCase();
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) throw { statusCode: 400, message: 'Email address is already registered.' };
    const existingUsername = await User.findByUsername(username.trim());
    if (existingUsername) throw { statusCode: 400, message: 'Username is already taken.' };

    const user = await User.create({
      id: `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      username: username.trim(),
      email,
      phone: String(mobile).replace(/[\s-]/g, ''),
      mobile_number: String(mobile).replace(/[\s-]/g, ''),
      password,
      role: 'user'
    });

    const otp = this.generateSecureOTP();
    await User.setOTP(user.id, await bcrypt.hash(otp, 10), 10 * 60 * 1000);
    try {
      await EmailService.sendOTPEmail(user, otp);
    } catch (err) {
      await User.deleteById(user.id);
      throw { statusCode: 503, message: 'We could not send the verification email right now. Please try again later.' };
    }

    return { requireVerification: true, email: user.email, message: 'Verification code sent to your email. It expires in 10 minutes.' };
  }

  static async verifyEmailOTP({ email, otp }) {
    if (!email || !/^\d{6}$/.test(String(otp || ''))) throw { statusCode: 400, message: 'Enter the 6-digit verification code.' };
    const user = await User.findByEmail(email.trim().toLowerCase());
    if (!user) throw { statusCode: 400, message: 'Invalid or expired verification code.' };
    if (user.email_verified) {
      const token = generateToken({ userId: user.id, role: user.role });
      const { password_hash, otp_hash, reset_otp_hash, ...safeUser } = user;
      return { user: safeUser, token, message: 'Email already verified.' };
    }
    if (!user.otp_hash || !user.otp_expiry || new Date(user.otp_expiry) <= new Date()) throw { statusCode: 400, message: 'Verification code has expired. Request a new code.' };
    if ((user.otp_attempts || 0) >= 5) throw { statusCode: 429, message: 'Too many incorrect attempts. Request a new code.' };
    const ok = await bcrypt.compare(String(otp), user.otp_hash);
    if (!ok) { await User.incrementOTPAttempts(user.id); throw { statusCode: 400, message: 'Invalid verification code.' }; }

    await User.setVerified(user.id);
    const verifiedUser = await User.findByEmail(user.email);
    NotificationService.create(user.id, 'welcome', 'Welcome to Elder’s Veil', `Welcome ${user.username}! Your account has been verified successfully.`, {}).catch(() => {});
    EmailService.sendWelcomeEmail(verifiedUser).catch(err => console.warn('[Email] Welcome email failed:', err.message));
    const token = generateToken({ userId: verifiedUser.id, role: verifiedUser.role });
    const { password_hash, otp_hash, reset_otp_hash, ...safeUser } = verifiedUser;
    return { user: safeUser, token, message: 'Email verified successfully.' };
  }

  static async resendEmailOTP({ email }) {
    const user = await User.findByEmail(String(email || '').trim().toLowerCase());
    if (!user) return { message: 'If an account exists with that email, a new verification code has been sent.' };
    if (user.email_verified) return { message: 'Your email is already verified. You can sign in.' };
    const otp = this.generateSecureOTP();
    await User.setOTP(user.id, await bcrypt.hash(otp, 10), 10 * 60 * 1000);
    await EmailService.sendOTPEmail(user, otp);
    return { message: 'A new verification code has been sent to your email.' };
  }

  static async login({ email, password }) {
    if (!email || !password) throw { statusCode: 400, message: 'Email and password are required.' };
    const user = await User.findByEmail(email.trim().toLowerCase());
    if (!user || !(await User.verifyPassword(user, password))) throw { statusCode: 401, message: 'Invalid email or password.' };
    if (user.email_verified === false) throw { statusCode: 403, message: 'Please verify your email before signing in.', requireVerification: true, email: user.email };
    if (user.account_status && user.account_status !== 'active') throw { statusCode: 403, message: `Your account is ${user.account_status}.` };
    const token = generateToken({ userId: user.id, role: user.role });
    const { password_hash, otp_hash, reset_otp_hash, ...safeUser } = user;
    return { user: safeUser, token };
  }

  static async requestPasswordReset({ email }) {
    const normalized = String(email || '').trim().toLowerCase();
    const generic = { message: 'If an account exists with that email, a password reset code has been sent.' };
    if (!isValidEmail(normalized)) return generic;
    const user = await User.findByEmail(normalized);
    if (!user) return generic;
    const otp = this.generateSecureOTP();
    await User.setResetOTP(user.id, await bcrypt.hash(otp, 10), 10 * 60 * 1000);
    await EmailService.sendForgotPasswordOTPEmail(user, otp);
    return generic;
  }

  static async verifyResetOTP({ email, otp }) {
    const user = await User.findByEmail(String(email || '').trim().toLowerCase());
    if (!user || !/^\d{6}$/.test(String(otp || ''))) throw { statusCode: 400, message: 'Invalid or expired reset code.' };
    if (!user.reset_otp_hash || !user.reset_otp_expiry || new Date(user.reset_otp_expiry) <= new Date()) throw { statusCode: 400, message: 'Reset code has expired. Request a new code.' };
    if ((user.reset_otp_attempts || 0) >= 5) throw { statusCode: 429, message: 'Too many incorrect attempts. Request a new code.' };
    const ok = await bcrypt.compare(String(otp), user.reset_otp_hash);
    if (!ok) { await User.incrementResetOTPAttempts(user.id); throw { statusCode: 400, message: 'Invalid reset code.' }; }
    const resetToken = crypto.randomBytes(32).toString('hex');
    await User.setResetOTP(user.id, await bcrypt.hash(`TOKEN:${resetToken}`, 10), 10 * 60 * 1000);
    return { resetToken, message: 'Code verified. You can now choose a new password.' };
  }

  static async resetPassword({ email, resetToken, newPassword, confirmPassword }) {
    if (!email || !newPassword || !confirmPassword) throw { statusCode: 400, message: 'Email, new password, and confirm password are required.' };
    if (newPassword !== confirmPassword) throw { statusCode: 400, message: 'Passwords do not match.' };
    if (!isValidPassword(newPassword)) throw { statusCode: 400, message: 'Password must be at least 6 characters long.' };
    const user = await User.findByEmail(email.trim().toLowerCase());
    if (!user || !user.reset_otp_hash || !user.reset_otp_expiry || new Date(user.reset_otp_expiry) <= new Date()) throw { statusCode: 400, message: 'Reset session expired. Request a new code.' };
    await User.updatePassword(user.id, newPassword);
    await User.clearResetOTP(user.id);
    return { message: 'Password reset successful. You may now sign in.' };
  }
}

module.exports = AuthService;
