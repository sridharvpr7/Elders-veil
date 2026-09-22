const express = require('express');
const router = express.Router();
const ChapterController = require('../controllers/chapterController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const creatorMiddleware = (req, res, next) => { if (!req.user || !['admin','creator','user'].includes(req.user.role)) return res.status(403).json({ error: 'Login required.' }); next(); };

// Get chapters for a comic
router.get('/comic/:comicId', ChapterController.getComicChapters);
router.get('/mine', authMiddleware, ChapterController.getMyChapters);
router.get('/:id', optionalAuthMiddleware, ChapterController.getChapterById);

// Admin-only endpoints
router.post('/', authMiddleware, creatorMiddleware, ChapterController.createChapter);
router.put('/:id', authMiddleware, creatorMiddleware, ChapterController.updateChapter);
router.delete('/:id', authMiddleware, creatorMiddleware, ChapterController.deleteChapter);
router.post('/:id/publish', authMiddleware, adminMiddleware, ChapterController.publishChapter);
router.post('/:id/reject', authMiddleware, adminMiddleware, ChapterController.rejectChapter);
router.post('/:id/resubmit', authMiddleware, ChapterController.resubmitChapter);

module.exports = router;
