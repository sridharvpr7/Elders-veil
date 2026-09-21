const UploadService = require('../services/uploadService');

class UploadController {
  static async uploadCover(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }
    const url = UploadService.processSingleFile(req.file);
    res.status(200).json({ url, message: 'Cover image uploaded successfully.' });
  }

  static async uploadBanner(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }
    const url = UploadService.processSingleFile(req.file);
    res.status(200).json({ url, message: 'Banner image uploaded successfully.' });
  }

  static async uploadChapterPages(req, res) {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No chapter page images uploaded.' });
    }
    const urls = UploadService.processMultipleFiles(req.files);
    res.status(200).json({ urls, count: urls.length, message: `${urls.length} chapter pages uploaded successfully.` });
  }
}

module.exports = UploadController;
