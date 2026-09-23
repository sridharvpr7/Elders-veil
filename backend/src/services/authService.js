const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { isValidEmail, isValidUsername, isValidPassword } = require('../utils/validation');
const NotificationService = require('./notificationService');

class AuthService {
  static async register({ username, email, phone, password, confirmPassword }) {
    if (!username || !email || !phone || !password) {
      throw { statusCode: 400, message: 'Username, email, mobile number, and password are required.' };
    }
    if (!/^\+?[0-9]{10,15}$/.test(String(phone).replace(/[\s-]/g, ''))) {
      throw { statusCode: 400, message: 'Enter a valid mobile number.' };
    }
    if (confirmPassword && password !== confirmPassword) {
      throw { statusCode: 400, message: 'Passwords do not match.' };
    }
    if (!isValidUsername(username)) {
      throw { statusCode: 400, message: 'Username must be between 3 and 30 characters.' };
    }
    if (!isValidEmail(email)) {
      throw { statusCode: 400, message: 'Invalid email address format.' };
    }
    if (!isValidPassword(password)) {
      throw { statusCode: 400, message: 'Password must be at least 6 characters long.' };
    }

    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      throw { statusCode: 400, message: 'Email address is already registered.' };
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      throw { statusCode: 400, message: 'Username is already taken.' };
    }

    const userId = `user-${Date.now()}`;
    const user = await User.create({
      id: userId,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      phone: String(phone).replace(/[\s-]/g, ''),
      password,
      role: 'user'
    });

    NotificationService.create(user.id,'welcome','Welcome to Elder’s Veil',`Welcome ${user.username}! Your account has been created successfully.`,{}).catch(()=>{});
    NotificationService.whatsapp(user,'elder_veil_welcome',{name:user.username}).catch(()=>{});
    const token = generateToken({ userId: user.id, role: user.role });
    return { user, token };
  }

  static async login({ email, password }) {
    if (!email || !password) {
      throw { statusCode: 400, message: 'Email and password are required.' };
    }

    const user = await User.findByEmail(email.trim().toLowerCase());
    if (!user) {
      throw { statusCode: 401, message: 'Invalid email or password.' };
    }

    const isMatch = await User.verifyPassword(user, password);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid email or password.' };
    }

    const token = generateToken({ userId: user.id, role: user.role });
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, token };
  }
}

module.exports = AuthService;
