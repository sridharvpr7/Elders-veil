const express = require('express');
const router = express.Router();
const ComicController = require('../controllers/comicController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/', optionalAuthMiddleware, ComicController.getComics);
router.get('/genres', ComicController.getGenres);
router.get('/slug/:slug', optionalAuthMiddleware, ComicController.getComicBySlug);
router.post('/:id/view', ComicController.recordView);
router.post('/:id/publish', authMiddleware, ComicController.publishComic);
router.get('/:id', optionalAuthMiddleware, ComicController.getComicById);

// Admin-only endpoints
router.post('/', authMiddleware, ComicController.createComic);
router.put('/:id', authMiddleware, adminMiddleware, ComicController.updateComic);
router.delete('/:id', authMiddleware, adminMiddleware, ComicController.deleteComic);

module.exports = router;
