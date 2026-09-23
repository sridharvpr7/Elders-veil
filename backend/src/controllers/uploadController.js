const UploadService = require('../services/uploadService');
const Comic = require('../models/Comic');

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

  static async uploadAvatar(req, res) {
    if (!req.file) return res.status(400).json({ error: 'No avatar image uploaded.' });
    const url = UploadService.processSingleFile(req.file);
    await require('../models/User').updateProfile(req.user.id, { avatar: url });
    res.status(200).json({ url, message: 'Profile picture updated successfully.' });
  }

  static async uploadChapterPages(req, res) {
    const comicId = req.body.comicId;
    if (!comicId) return res.status(400).json({ error: 'comicId is required.' });
    const comic = await Comic.findById(comicId);
    if (!comic) return res.status(404).json({ error: 'Comic not found.' });
    if (req.user.role !== 'admin' && comic.creatorId !== req.user.id) return res.status(403).json({ error: 'You can only upload pages to your own comic.' });
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No chapter page images uploaded.' });
    }
    const urls = UploadService.processMultipleFiles(req.files);
    res.status(200).json({ urls, count: urls.length, message: `${urls.length} chapter pages uploaded successfully.` });
  }
}

module.exports = UploadController;
