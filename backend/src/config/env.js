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
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
  WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || '',
  WHATSAPP_AUTO_REPLY_ENABLED: String(process.env.WHATSAPP_AUTO_REPLY_ENABLED || 'false').toLowerCase() === 'true',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  WHATSAPP_TEMPLATE_LANGUAGE: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US',
  WHATSAPP_WELCOME_TEMPLATE: process.env.WHATSAPP_WELCOME_TEMPLATE || 'elders_veil_welcome',
  WHATSAPP_NEW_COMIC_TEMPLATE: process.env.WHATSAPP_NEW_COMIC_TEMPLATE || 'elder_veil_new_comic',
  WHATSAPP_NEW_CHAPTER_TEMPLATE: process.env.WHATSAPP_NEW_CHAPTER_TEMPLATE || 'elder_veil_new_chapter',
  WHATSAPP_ADMIN_PROMOTED_TEMPLATE: process.env.WHATSAPP_ADMIN_PROMOTED_TEMPLATE || 'elder_veil_admin_promoted',
  WHATSAPP_ADMIN_REMOVED_TEMPLATE: process.env.WHATSAPP_ADMIN_REMOVED_TEMPLATE || 'elder_veil_admin_removed',
  WHATSAPP_ACCOUNT_DELETED_TEMPLATE: process.env.WHATSAPP_ACCOUNT_DELETED_TEMPLATE || 'elder_veil_account_deleted',
  WHATSAPP_API_VERSION: process.env.WHATSAPP_API_VERSION || 'v26.0'
};
