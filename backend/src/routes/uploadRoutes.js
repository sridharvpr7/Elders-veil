const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/uploadController');
const upload = require('../middleware/uploadMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const creatorMiddleware = (req, res, next) => { if (!req.user || !['admin','creator'].includes(req.user.role)) return res.status(403).json({ error: 'Creator privileges required.' }); next(); };

// Protect upload routes for admin only
router.use(authMiddleware, creatorMiddleware);

router.post('/cover', upload.single('cover'), UploadController.uploadCover);
router.post('/banner', upload.single('banner'), UploadController.uploadBanner);
router.post('/chapter-pages', upload.array('pages', 50), UploadController.uploadChapterPages);

module.exports = router;
