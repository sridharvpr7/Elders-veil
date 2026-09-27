const env = require('../config/env');

class UploadService {
  static getPublicUrl(filePath) {
    if (!filePath) return '';
<<<<<<< HEAD
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;

    const normalized = filePath.replace(/\\/g, '/');
    const marker = '/uploads/';
    const index = normalized.lastIndexOf(marker);
    const relative = index >= 0 ? normalized.slice(index) : normalized.startsWith('/') ? normalized : `/${normalized}`;

    if (env.UPLOAD_BASE_URL) {
      return `${env.UPLOAD_BASE_URL.replace(/\/$/, '')}${relative}`;
=======
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    // Format relative path for public serving
    const normalized = filePath.replace(/\\/g, '/');
    const relative = normalized.includes('/uploads/')
      ? '/uploads/' + normalized.split('/uploads/')[1]
      : normalized.startsWith('/') ? normalized : '/' + normalized;

    // When the frontend is hosted separately (for example GitHub Pages),
    // return an absolute backend asset URL so uploaded images still resolve.
    if (env.UPLOAD_BASE_URL) {
      return env.UPLOAD_BASE_URL.replace(/\/$/, '') + relative;
>>>>>>> 6a53d8b0e5c76d31635d88301f5463f6020248a2
    }
    return relative;
  }

  static processSingleFile(file) { return file ? this.getPublicUrl(file.path) : null; }
  static processMultipleFiles(files) { return Array.isArray(files) ? files.map(file => this.getPublicUrl(file.path)) : []; }
}
module.exports = UploadService;
