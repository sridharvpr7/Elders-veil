const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/me', UserController.getProfile);
router.put('/me', UserController.updateProfile);
router.post('/me/password', UserController.changePassword);

router.get('/me/bookmarks', UserController.getBookmarks);
router.post('/me/bookmarks', UserController.addBookmark);
router.delete('/me/bookmarks/:comicId', UserController.removeBookmark);

router.get('/me/favorites', UserController.getFavorites);
router.post('/me/favorites', UserController.addFavorite);
router.delete('/me/favorites/:comicId', UserController.removeFavorite);

router.get('/me/history', UserController.getHistory);
router.post('/me/history', UserController.saveHistory);

module.exports = router;
