const express = require('express');
const router = express.Router();
const ChapterController = require('../controllers/chapterController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Get chapters for a comic
router.get('/comic/:comicId', ChapterController.getComicChapters);
router.get('/:id', optionalAuthMiddleware, ChapterController.getChapterById);

// Admin-only endpoints
router.post('/', authMiddleware, adminMiddleware, ChapterController.createChapter);
router.put('/:id', authMiddleware, adminMiddleware, ChapterController.updateChapter);
router.delete('/:id', authMiddleware, adminMiddleware, ChapterController.deleteChapter);

module.exports = router;
