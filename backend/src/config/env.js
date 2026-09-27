const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'elders_veil_default_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5000',
  UPLOAD_BASE_URL: process.env.UPLOAD_BASE_URL || '',
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(__dirname, '../../../uploads'),
  EMAIL_HOST: process.env.EMAIL_HOST || '',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587', 10),
  EMAIL_SECURE: String(process.env.EMAIL_SECURE || 'false').toLowerCase() === 'true',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@eldersveil.com',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || "Elder's Veil",
  RAZORPAY_KEY_ID: String(process.env.RAZORPAY_KEY_ID || '').trim(),
  RAZORPAY_KEY_SECRET: String(process.env.RAZORPAY_KEY_SECRET || '').trim(),
  PREMIUM_PRICE_INR: parseInt(process.env.PREMIUM_PRICE_INR || '499',10),
  AI_API_URL: process.env.AI_API_URL || '',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'default'
};
