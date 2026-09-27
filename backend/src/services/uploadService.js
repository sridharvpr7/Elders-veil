const env = require('../config/env');

class UploadService {
  static getPublicUrl(filePath) {
    if (!filePath) return '';

    // Already a full URL
    if (
      filePath.startsWith('http://') ||
      filePath.startsWith('https://')
    ) {
      return filePath;
    }

    // Normalize Windows/Linux paths
    const normalized = String(filePath).replace(/\\/g, '/');

    // Convert absolute upload paths into /uploads/...
    const uploadMarker = '/uploads/';
    const uploadIndex = normalized.indexOf(uploadMarker);

    let relative;

    if (uploadIndex !== -1) {
      relative = normalized.substring(uploadIndex);
    } else if (normalized.startsWith('/uploads/')) {
      relative = normalized;
    } else if (normalized.startsWith('uploads/')) {
      relative = '/' + normalized;
    } else {
      relative = '/uploads/' + normalized.split('/').pop();
    }

    // If backend public URL is configured,
    // return complete URL for frontend.
    const baseUrl = String(env.UPLOAD_BASE_URL || '').replace(/\/+$/, '');

    if (baseUrl) {
      return `${baseUrl}${relative}`;
    }

    return relative;
  }

  static processSingleFile(file) {
    if (!file) return null;

    return this.getPublicUrl(file.path);
  }

  static processMultipleFiles(files) {
    if (!Array.isArray(files)) return [];

    return files
      .filter(Boolean)
      .map(file => this.getPublicUrl(file.path));
  }
}

module.exports = UploadService;