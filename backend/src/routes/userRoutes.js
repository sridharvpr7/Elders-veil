const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');

router.get('/creator/:id', optionalAuthMiddleware, UserController.getPublicCreator);
router.use(authMiddleware);
router.get('/me', UserController.getProfile);
router.put('/me', UserController.updateProfile);
router.post('/me/become-creator', UserController.becomeCreator);
router.post('/me/password', UserController.changePassword);

router.get('/me/bookmarks', UserController.getBookmarks);
router.post('/me/bookmarks', UserController.addBookmark);
router.delete('/me/bookmarks/:comicId', UserController.removeBookmark);

router.get('/me/favorites', UserController.getFavorites);
router.post('/me/favorites', UserController.addFavorite);
router.delete('/me/favorites/:comicId', UserController.removeFavorite);

router.get('/me/history', UserController.getHistory);
router.get('/me/recommendations', UserController.getRecommendations);
router.get('/me/achievements', UserController.getAchievements);
router.post('/me/history', UserController.saveHistory);
router.post('/me/support', require('../controllers/featureController').support);
router.get('/me/support', require('../controllers/featureController').myTickets);


module.exports = router;
