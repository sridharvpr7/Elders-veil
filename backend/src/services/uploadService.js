const env = require('../config/env');

class UploadService {
  static getPublicUrl(filePath) {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    // Format relative path for public serving
    const normalized = filePath.replace(/\\/g, '/');
    const relative = normalized.includes('/uploads/') 
      ? '/uploads/' + normalized.split('/uploads/')[1] 
      : normalized;

    return relative;
  }

  static processSingleFile(file) {
    if (!file) return null;
    return this.getPublicUrl(file.path);
  }

  static processMultipleFiles(files) {
    if (!Array.isArray(files)) return [];
    return files.map(file => this.getPublicUrl(file.path));
  }
}

module.exports = UploadService;
