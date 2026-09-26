const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const AdminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);

router.get('/me', UserController.getProfile);
router.put('/me', UserController.updateProfile);
router.post('/me/become-creator', UserController.becomeCreator);
router.post('/me/password', UserController.changePassword);

router.post('/premium-request', UserController.requestPremium);
router.get('/premium-status', UserController.getPremiumStatus);

router.get('/me/bookmarks', UserController.getBookmarks);
router.post('/me/bookmarks', UserController.addBookmark);
router.delete('/me/bookmarks/:comicId', UserController.removeBookmark);

router.get('/me/favorites', UserController.getFavorites);
router.post('/me/favorites', UserController.addFavorite);
router.delete('/me/favorites/:comicId', UserController.removeFavorite);

router.get('/me/history', UserController.getHistory);
router.post('/me/history', UserController.saveHistory);

// Admin User Deletion under /api/users/:id
router.delete('/:id', adminMiddleware, AdminController.deleteUser);

module.exports = router;
