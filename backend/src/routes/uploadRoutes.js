const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/uploadController');
const upload = require('../middleware/uploadMiddleware');
const { chapterPageUpload, avatarUpload } = upload;
const { authMiddleware } = require('../middleware/authMiddleware');
const creatorMiddleware = (req, res, next) => { if (!req.user || !['admin','creator'].includes(req.user.role)) return res.status(403).json({ error: 'Become a Comic Writer before uploading.' }); next(); };

// Profile pictures are available to every authenticated account.
router.post('/avatar', authMiddleware, avatarUpload.single('avatar'), UploadController.uploadAvatar);

// Comic uploads are restricted to admins and approved comic writers.
router.use(authMiddleware, creatorMiddleware);

router.post('/cover', upload.single('cover'), UploadController.uploadCover);
router.post('/banner', upload.single('banner'), UploadController.uploadBanner);
router.post('/chapter-pages', chapterPageUpload.array('pages', 50), UploadController.uploadChapterPages);

module.exports = router;
