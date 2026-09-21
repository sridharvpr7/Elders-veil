const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.post('/change-password', authMiddleware, authController.changePassword);
router.delete('/account', authMiddleware, authController.deleteAccount);

module.exports = router;
