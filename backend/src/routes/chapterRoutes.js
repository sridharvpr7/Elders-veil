const express = require('express');
const router = express.Router();
const ChapterController = require('../controllers/chapterController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const creatorMiddleware = (req, res, next) => { if (!req.user || !['admin','creator'].includes(req.user.role)) return res.status(403).json({ error: 'Creator privileges required.' }); next(); };

// Get chapters for a comic
router.get('/comic/:comicId', ChapterController.getComicChapters);
router.get('/:id', optionalAuthMiddleware, ChapterController.getChapterById);

// Admin-only endpoints
router.post('/', authMiddleware, creatorMiddleware, ChapterController.createChapter);
router.put('/:id', authMiddleware, creatorMiddleware, ChapterController.updateChapter);
router.delete('/:id', authMiddleware, creatorMiddleware, ChapterController.deleteChapter);

module.exports = router;
