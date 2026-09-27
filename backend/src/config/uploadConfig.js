const fs = require('fs');
const path = require('path');
const env = require('./env');

const projectUploads = path.resolve(__dirname, '../../../uploads');
const configuredUploads = env.UPLOAD_DIR ? path.resolve(env.UPLOAD_DIR) : projectUploads;

function canUseDirectory(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch (error) {
    console.warn(`[Uploads] Cannot write to ${dir}: ${error.code || error.message}`);
    return false;
  }
}

// Prefer the configured persistent-disk path. If no disk is attached (common on
// Render Free), fall back to the app's writable ephemeral uploads directory so
// the server never crashes during startup.
const UPLOAD_DIR = canUseDirectory(configuredUploads)
  ? configuredUploads
  : projectUploads;

if (UPLOAD_DIR !== configuredUploads) {
  canUseDirectory(UPLOAD_DIR);
  console.warn(`[Uploads] Falling back to ${UPLOAD_DIR}. Files are ephemeral until a persistent disk/object storage is configured.`);
}

const dirs = {
  covers: path.join(UPLOAD_DIR, 'covers'),
  banners: path.join(UPLOAD_DIR, 'banners'),
  avatars: path.join(UPLOAD_DIR, 'avatars'),
  comics: path.join(UPLOAD_DIR, 'comics')
};

Object.values(dirs).forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

module.exports = { UPLOAD_DIR, dirs };
