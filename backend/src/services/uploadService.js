const env = require('../config/env');

class UploadService {
  static getPublicUrl(filePath) {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;

    const normalized = filePath.replace(/\\/g, '/');
    const marker = '/uploads/';
    const index = normalized.lastIndexOf(marker);
    const relative = index >= 0 ? normalized.slice(index) : normalized.startsWith('/') ? normalized : `/${normalized}`;

    if (env.UPLOAD_BASE_URL) {
      return `${env.UPLOAD_BASE_URL.replace(/\/$/, '')}${relative}`;
    }
    return relative;
  }

  static processSingleFile(file) { return file ? this.getPublicUrl(file.path) : null; }
  static processMultipleFiles(files) { return Array.isArray(files) ? files.map(file => this.getPublicUrl(file.path)) : []; }
}
module.exports = UploadService;
