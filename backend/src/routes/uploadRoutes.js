const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/uploadController');
const upload = require('../middleware/uploadMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Protect upload routes for admin only
router.use(authMiddleware, adminMiddleware);

router.post('/cover', upload.single('cover'), UploadController.uploadCover);
router.post('/banner', upload.single('banner'), UploadController.uploadBanner);
router.post('/chapter-pages', upload.array('pages', 50), UploadController.uploadChapterPages);

module.exports = router;
